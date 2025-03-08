"use strict";

const padStart = require("pad-start");
const randomHex = require("crypto-random-hex");

const kBigInteger = Symbol("big-integer");
const kHexLength = Symbol("hex-length");

class SRPInteger {
  constructor(bigInteger, hexLength) {
    this[kBigInteger] = bigInteger;
    this[kHexLength] = hexLength;
  }

  equals(val) {
    return this[kBigInteger] === val[kBigInteger];
  }

  add(val) {
    return new SRPInteger(
      this[kBigInteger] + val[kBigInteger],
      this[kHexLength] || val[kHexLength]
    );
  }

  multiply(val) {
    return new SRPInteger(
      this[kBigInteger] * val[kBigInteger],
      this[kHexLength] || val[kHexLength]
    );
  }

  subtract(val) {
    return new SRPInteger(
      this[kBigInteger] - val[kBigInteger],
      this[kHexLength] || val[kHexLength]
    );
  }

  modPow(exponent, m) {
    const modPowBigInt = (base, exp, mod) => {
      let result = 1n;
      base = ((base % mod) + mod) % mod; // 保证 base 为正
      while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
      }
      return result;
    };

    return new SRPInteger(
      modPowBigInt(this[kBigInteger], exponent[kBigInteger], m[kBigInteger]),
      m[kHexLength]
    );
  }

  mod(m) {
    let result = this[kBigInteger] % m[kBigInteger];
    if (result < 0n) result += m[kBigInteger];
    return new SRPInteger(result, m[kHexLength]);
  }

  xor(val) {
    return new SRPInteger(
      this[kBigInteger] ^ val[kBigInteger],
      this[kHexLength]
    );
  }

  inspect() {
    const hex = this[kBigInteger].toString(16);
    return `<SRPInteger ${hex.slice(0, 16)}${hex.length > 16 ? "..." : ""}>`;
  }

  toHex() {
    if (this[kHexLength] === null) {
      throw new Error("This SRPInteger has no specified length");
    }

    let hex = this[kBigInteger].toString(16);
    if (hex.startsWith("-")) {
      throw new Error("Negative values cannot be represented in hex");
    }

    return padStart(hex, this[kHexLength], "0");
  }
}

SRPInteger.fromHex = function (input) {
  return new SRPInteger(BigInt("0x" + input), input.length);
};

SRPInteger.randomInteger = function (bytes) {
  return SRPInteger.fromHex(randomHex(bytes));
};

SRPInteger.ZERO = new SRPInteger(0n, null);

module.exports = SRPInteger;
