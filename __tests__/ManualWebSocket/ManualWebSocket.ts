import { ManualWebSocket } from "../../src/ManualWebSocket/ManualWebSocket";

jest.mock("../../src/ManualWebSocket/TrackedAddresses");
const {
  GlobalTrackedAddresses
} = require("../../src/ManualWebSocket/TrackedAddresses");
GlobalTrackedAddresses.isTracked.mockImplementation(() => true);

jest.mock("../../src/WebSocket/ReadyState");
import { ReadyState } from "../../src/WebSocket/ReadyState";

describe("ManualWebSocket module", () => {
  test("Should be created with 'CONNECTING' readyState", () => {
    const { IsReadyState } = require("../../src/WebSocket/ReadyState");
    IsReadyState.mockImplementation(() => true);

    const mws = new ManualWebSocket("url");
    const expectedReadyState = ReadyState.CONNECTING;
    const actualReadyState = mws.readyState;

    expect(actualReadyState).toBe(expectedReadyState);
  });

  test("Should be created with provided connection url", () => {
    const url = "url";
    const mws = new ManualWebSocket(url);
    const actualUrl = mws.getUrl();

    expect(actualUrl).toBe(url);
  });

  describe("Set Ready State", () => {
    test("Should change ready state when given ready state is valid", () => {
      const expectedReadyState = ReadyState.OPEN;
      const { IsReadyState } = require("../../src/WebSocket/ReadyState");
      IsReadyState.mockImplementation(() => true);

      const mws = new ManualWebSocket("url");
      mws.onopen = jest.fn();
      mws.readyState = ReadyState.OPEN;

      const actualReadyState = mws.readyState;
      expect(actualReadyState).toBe(expectedReadyState);
    });

    test("Should throw an error when given state is invalid", () => {
      const { IsReadyState } = require("../../src/WebSocket/ReadyState");
      IsReadyState.mockImplementation(() => true);

      const mws = new ManualWebSocket("url");

      IsReadyState.mockImplementation(() => false);

      const invalidState = 999;
      expect(() => (mws.readyState = invalidState)).toThrow(
        `Given 999 is not a valid ReadyState`
      );
    });
  });

  describe("Event listeners", () => {
    test("Shoud add and remove event listener", () => {
      const { IsReadyState } = require("../../src/WebSocket/ReadyState");
      IsReadyState.mockImplementation(() => true);

      const mws = new ManualWebSocket("url");
      mws.onopen = jest.fn();
      mws.onmessage = jest.fn();

      const callback = jest.fn();
      mws.addEventListener("message", callback);

      mws.readyState = ReadyState.OPEN;
      mws.publishMessage("some message");

      expect(callback.mock.calls.length).toBe(1);

      mws.removeEventListener("message", callback);
      mws.publishMessage("some message");

      expect(callback.mock.calls.length).toBe(1);
    });
  });

  describe("Server communication", () => {
    test("Can stack server responses and execute them in order", () => {
      const mws = new ManualWebSocket("url");
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const message = "some message";
      mws.prepareServerCallback([
        { message: message, callback: callback1 },
        { message: message, callback: callback2 },
        { message: message, callback: callback3 }
      ]);

      mws.send(message);
      expect(callback1.mock.calls.length).toBe(1);
      expect(callback2.mock.calls.length).toBe(0);
      expect(callback3.mock.calls.length).toBe(0);

      mws.send(message);
      expect(callback1.mock.calls.length).toBe(1);
      expect(callback2.mock.calls.length).toBe(1);
      expect(callback3.mock.calls.length).toBe(0);

      mws.send(message);
      expect(callback1.mock.calls.length).toBe(1);
      expect(callback2.mock.calls.length).toBe(1);
      expect(callback3.mock.calls.length).toBe(1);
    });

    test("Should execute matching callback one time", () => {
      const mws = new ManualWebSocket("url");
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const message1 = "some message";
      const message2 = "other message";

      mws.prepareServerCallback([
        { message: message1, callback: callback1 },
        { message: message2, callback: callback2 }
      ]);

      mws.send(message2);
      expect(callback1.mock.calls.length).toBe(0);
      expect(callback2.mock.calls.length).toBe(1);

      mws.send(message2);
      expect(callback1.mock.calls.length).toBe(0);
      expect(callback2.mock.calls.length).toBe(1);
    });
  });
});
