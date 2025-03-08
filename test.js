/* eslint-env mocha */

const assert = require("assert");

const client = require("./client");
const server = require("./server");
const SRPInteger = require("./lib/srp-integer");

describe("Secure Remote Password", () => {
  it("should authenticate a user consistently under random conditions", function () {
    this.timeout(10000); // 增加超时时间，以防随机大数计算耗时过长

    const username = "linus@folkdatorn.se";
    const password = "$uper$ecure";

    for (let i = 0; i < 100; i++) {
      // 循环100次，增强鲁棒性
      const salt = client.generateSalt();
      const privateKey = client.derivePrivateKey(salt, username, password);
      const verifier = client.deriveVerifier(privateKey);

      const clientEphemeral = client.generateEphemeral();
      const serverEphemeral = server.generateEphemeral(verifier);

      const clientSession = client.deriveSession(
        clientEphemeral.secret,
        serverEphemeral.public,
        salt,
        username,
        privateKey
      );
      const serverSession = server.deriveSession(
        serverEphemeral.secret,
        clientEphemeral.public,
        salt,
        username,
        verifier,
        clientSession.proof
      );

      client.verifySession(
        clientEphemeral.public,
        clientSession,
        serverSession.proof
      );

      assert.strictEqual(clientSession.key, serverSession.key);
    }
  });
});

describe("SRPInteger", () => {
  it("should keep padding when going back and forth", () => {
    const testCases = [
      "a",
      "0a",
      "00a",
      "000a",
      "0000a",
      "00000a",
      "000000a",
      "0000000a",
      "00000000a",
    ];

    for (const testCase of testCases) {
      assert.strictEqual(SRPInteger.fromHex(testCase).toHex(), testCase);
    }
  });

  it("should correctly handle large integers and modular arithmetic consistently", function () {
    this.timeout(5000);
    const bigHex = "f".repeat(512); // 非常大的数，512个f
    const a = SRPInteger.fromHex(bigHex);
    const b = SRPInteger.fromHex("1");

    // 测试加减乘除
    assert.strictEqual(a.add(b).subtract(b).toHex(), bigHex);
    assert.strictEqual(a.multiply(b).toHex(), bigHex);

    // 测试模幂计算多次
    const mod = SRPInteger.fromHex("f".repeat(256));
    const exponent = SRPInteger.fromHex("3");
    for (let i = 0; i < 50; i++) {
      const result = a.modPow(exponent, mod);
      assert.ok(result.toHex().length <= mod.toHex().length);
      assert.ok(!result.toHex().startsWith("-"));
    }
  });
});
