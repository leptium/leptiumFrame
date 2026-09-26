/**
 * Generador autónomo y ultraligero de códigos QR vectoriales en SVG puro y Canvas.
 * Sin dependencias externas, ideal para tablets de bajos recursos y ejecución offline.
 * Soporta Codificación Byte (URLs y texto) con Corrección de Errores Nivel M.
 */

// Tablas Galois Field GF(256) con polinomio primitivo 0x11d
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
})();

function gfMultiply(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

// Genera polinomio generador Reed-Solomon de grado n
function rsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const factor = new Uint8Array([1, GF256_EXP[i]]);
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], factor[0]);
      nextPoly[j + 1] ^= gfMultiply(poly[j], factor[1]);
    }
    poly = nextPoly;
  }
  return poly;
}

// Calcula los bloques de paridad Reed-Solomon
function rsCalculateRemainder(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMultiply(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMultiply(gen[ecCount], factor);
  }
  return remainder;
}

// Tabla simplificada de versiones QR con Nivel M (Medium Error Correction)
const QR_VERSIONS = [
  null,
  { version: 1, totalCodewords: 26, dataCodewords: 16, ecCodewords: 10, align: [] },
  { version: 2, totalCodewords: 44, dataCodewords: 28, ecCodewords: 16, align: [6, 18] },
  { version: 3, totalCodewords: 70, dataCodewords: 44, ecCodewords: 26, align: [6, 22] },
  { version: 4, totalCodewords: 100, dataCodewords: 64, ecCodewords: 36, align: [6, 26] },
  { version: 5, totalCodewords: 134, dataCodewords: 86, ecCodewords: 48, align: [6, 30] }
];

export class QRCode {
  /**
   * Genera la matriz booleana del código QR.
   */
  static generateMatrix(text) {
    const raw = String(text || 'https://leptiumframe.app').trim();
    const canonicalText = /^https?:\/\//i.test(raw)
      ? raw.replace(/^http:\/\//i, 'https://')
      : `https://${raw}`;
    const dataBytes = new TextEncoder().encode(canonicalText);

    let chosenVersion = null;
    for (let v = 1; v <= 5; v++) {
      const vInfo = QR_VERSIONS[v];
      const neededBytes = 2 + dataBytes.length;
      if (neededBytes <= vInfo.dataCodewords) {
        chosenVersion = vInfo;
        break;
      }
    }

    if (!chosenVersion) {
      chosenVersion = QR_VERSIONS[5];
    }

    const { version, dataCodewords, ecCodewords, align } = chosenVersion;
    const moduleCount = 17 + 4 * version;

    const bitStream = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) {
        bitStream.push((val >> i) & 1);
      }
    }

    pushBits(0b0100, 4); // Modo Byte
    pushBits(dataBytes.length, 8); // Longitud
    for (let b of dataBytes) {
      pushBits(b, 8);
    }

    const maxBits = dataCodewords * 8;
    const termLen = Math.min(4, maxBits - bitStream.length);
    pushBits(0, termLen);

    while (bitStream.length % 8 !== 0) {
      bitStream.push(0);
    }

    const dataBuff = new Uint8Array(dataCodewords);
    let byteIdx = 0;
    for (let i = 0; i < bitStream.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bitStream[i + j];
      }
      dataBuff[byteIdx++] = b;
    }

    let pad = 0xEC;
    while (byteIdx < dataCodewords) {
      dataBuff[byteIdx++] = pad;
      pad = pad === 0xEC ? 0x11 : 0xEC;
    }

    const ecBuff = rsCalculateRemainder(dataBuff, ecCodewords);

    const matrix = Array.from({ length: moduleCount }, () => new Int8Array(moduleCount).fill(-1));
    const isReserved = Array.from({ length: moduleCount }, () => new Uint8Array(moduleCount));

    function setModule(r, c, val) {
      matrix[r][c] = val ? 1 : 0;
      isReserved[r][c] = 1;
    }

    // 1. Finder patterns (7x7)
    function placeFinder(startR, startC) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isEdge = (r === 0 || r === 6 || c === 0 || c === 6);
          const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(startR + r, startC + c, isEdge || isCenter);
        }
      }
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const rr = startR + i;
          const cc = startC + j;
          if (rr >= 0 && rr < moduleCount && cc >= 0 && cc < moduleCount) {
            if (!isReserved[rr][cc]) {
              setModule(rr, cc, 0);
            }
          }
        }
      }
    }

    placeFinder(0, 0);
    placeFinder(0, moduleCount - 7);
    placeFinder(moduleCount - 7, 0);

    // 2. Alignment patterns
    if (align && align.length > 0) {
      for (let r of align) {
        for (let c of align) {
          if (isReserved[r][c]) continue;
          for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
              const isEdge = Math.abs(i) === 2 || Math.abs(j) === 2;
              const isCenter = i === 0 && j === 0;
              setModule(r + i, c + j, isEdge || isCenter);
            }
          }
        }
      }
    }

    // 3. Timing patterns
    for (let i = 8; i < moduleCount - 8; i++) {
      if (!isReserved[6][i]) setModule(6, i, i % 2 === 0);
      if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0);
    }

    // 4. Dark module fijo
    setModule(4 * version + 9, 8, 1);

    for (let i = 0; i < 9; i++) {
      if (!isReserved[8][i]) isReserved[8][i] = 1;
      if (!isReserved[i][8]) isReserved[i][8] = 1;
    }
    for (let i = moduleCount - 8; i < moduleCount; i++) {
      if (!isReserved[8][i]) isReserved[8][i] = 1;
      if (!isReserved[i][8]) isReserved[i][8] = 1;
    }

    // 5. Intercalar datos
    const allCodewords = new Uint8Array(dataBuff.length + ecBuff.length);
    allCodewords.set(dataBuff, 0);
    allCodewords.set(ecBuff, dataBuff.length);

    let codewordIdx = 0;
    let bitIdx = 7;
    let upward = true;

    for (let right = moduleCount - 1; right > 0; right -= 2) {
      if (right === 6) right--;
      for (let vert = 0; vert < moduleCount; vert++) {
        const r = upward ? (moduleCount - 1 - vert) : vert;
        for (let c = right; c >= right - 1; c--) {
          if (!isReserved[r][c]) {
            let bit = 0;
            if (codewordIdx < allCodewords.length) {
              bit = (allCodewords[codewordIdx] >> bitIdx) & 1;
              bitIdx--;
              if (bitIdx < 0) {
                bitIdx = 7;
                codewordIdx++;
              }
            }
            const mask = (r + c) % 2 === 0;
            matrix[r][c] = (bit ^ (mask ? 1 : 0)) ? 1 : 0;
          }
        }
      }
      upward = !upward;
    }

    // 6. Información de formato
    const FORMAT_INFO_M0 = 0b101010000010010;
    for (let i = 0; i < 15; i++) {
      const bit = (FORMAT_INFO_M0 >> (14 - i)) & 1;
      if (i <= 5) matrix[8][i] = bit;
      else if (i === 6) matrix[8][7] = bit;
      else if (i === 7) matrix[8][8] = bit;
      else if (i === 8) matrix[7][8] = bit;
      else matrix[14 - i][8] = bit;

      if (i < 7) matrix[moduleCount - 1 - i][8] = bit;
      else matrix[8][moduleCount - 15 + i] = bit;
    }

    return { matrix, moduleCount };
  }

  /**
   * Genera una cadena SVG para una URL o texto dado.
   */
  static generateSVG(text, sizePx = 180, darkColor = '#ffffff', lightColor = 'transparent') {
    const { matrix, moduleCount } = this.generateMatrix(text);
    const quietZone = 3;
    const totalSize = moduleCount + quietZone * 2;
    let pathD = '';

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c] === 1) {
          const x = c + quietZone;
          const y = r + quietZone;
          pathD += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    return `
      <svg class="qr-code-svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${sizePx}" height="${sizePx}" xmlns="http://www.w3.org/2000/svg" style="display:block;border-radius:12px;background:${lightColor};">
        <path d="${pathD}" fill="${darkColor}" />
      </svg>
    `.trim();
  }

  /**
   * Dibuja el código QR directamente sobre un lienzo Canvas 2D.
   */
  static drawToCanvas(text, ctx, x, y, sizePx = 90, darkColor = '#ffffff', lightColor = 'rgba(0,0,0,0.85)') {
    const { matrix, moduleCount } = this.generateMatrix(text);
    const quietZone = 2;
    const totalSize = moduleCount + quietZone * 2;
    const cellSize = sizePx / totalSize;

    if (lightColor && lightColor !== 'transparent') {
      ctx.fillStyle = lightColor;
      ctx.fillRect(x, y, sizePx, sizePx);
    }

    ctx.fillStyle = darkColor;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c] === 1) {
          const px = Math.round(x + (c + quietZone) * cellSize);
          const py = Math.round(y + (r + quietZone) * cellSize);
          const nextPx = Math.round(x + (c + quietZone + 1) * cellSize);
          const nextPy = Math.round(y + (r + quietZone + 1) * cellSize);
          ctx.fillRect(px, py, nextPx - px, nextPy - py);
        }
      }
    }
  }
}
