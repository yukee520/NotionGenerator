const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8ToBytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const combined = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        bytes.push(0xf0 | (combined >> 18));
        bytes.push(0x80 | ((combined >> 12) & 0x3f));
        bytes.push(0x80 | ((combined >> 6) & 0x3f));
        bytes.push(0x80 | (combined & 0x3f));
        i += 1;
      } else {
        bytes.push(0xef);
        bytes.push(0xbf);
        bytes.push(0xbd);
      }
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function bytesToUtf8(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      out += String.fromCharCode(byte1);
      i += 1;
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[i + 1];
      out += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
      i += 2;
    } else if (byte1 < 0xf0) {
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      out += String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f),
      );
      i += 3;
    } else {
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      const byte4 = bytes[i + 3];
      const codePoint =
        ((byte1 & 0x07) << 18) |
        ((byte2 & 0x3f) << 12) |
        ((byte3 & 0x3f) << 6) |
        (byte4 & 0x3f);
      const adjusted = codePoint - 0x10000;
      out += String.fromCharCode(0xd800 + (adjusted >> 10));
      out += String.fromCharCode(0xdc00 + (adjusted & 0x3ff));
      i += 4;
    }
  }
  return out;
}

export function base64Encode(input: string): string {
  const bytes = utf8ToBytes(input);
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    out += BASE64_CHARS[b1 >> 2];
    out += BASE64_CHARS[((b1 & 0x03) << 4) | ((b2 ?? 0) >> 4)];
    out += b2 === undefined ? '=' : BASE64_CHARS[((b2 & 0x0f) << 2) | ((b3 ?? 0) >> 6)];
    out += b3 === undefined ? '=' : BASE64_CHARS[b3 & 0x3f];

    i += 3;
  }
  return out;
}

export function base64Decode(input: string): string {
  const cleaned = input.replace(/[\r\n\s]/g, '');
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE64_CHARS.length; i += 1) {
    lookup[BASE64_CHARS[i]] = i;
  }
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (ch === '=') break;
    const value = lookup[ch];
    if (value === undefined) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytesToUtf8(bytes);
}