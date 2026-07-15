import {
  extractRevertData,
  getContractErrorDescriptor,
  getContractErrorMessage,
} from '../contractErrors';

function makeRevertError(errorName: string, args: readonly unknown[]): Error {
  const reverted = Object.assign(new Error(errorName), {
    name: 'ContractFunctionRevertedError',
    data: { errorName, args },
  });
  return Object.assign(new Error('execution reverted'), {
    name: 'ContractFunctionExecutionError',
    walk: (predicate: (e: Error) => boolean) => (predicate(reverted) ? reverted : null),
  });
}

describe('contractErrors', () => {
  it('explains CST gesture cost changes from InsufficientReceivedBidAmount', () => {
    const err = makeRevertError('InsufficientReceivedBidAmount', [
      'gesture cost changed',
      1500000000000000000n,
      1000000000000000000n,
    ]);

    expect(
      getContractErrorMessage(err, {
        gestureCurrency: 'CST',
        displayedPriceWei: 1000000000000000000n,
      }),
    ).toBe(
      'CST Gesture Cost changed while your transaction was in transit, likely because another gesture landed first. The contract required 1.500000 CST, above your 1.000000 CST maximum. Refresh and try again.',
    );
  });

  it('keeps ETH gesture cost wording for existing callers', () => {
    const err = makeRevertError('InsufficientReceivedBidAmount', [
      'gesture cost changed',
      1500000000000000000n,
      1000000000000000000n,
    ]);

    expect(getContractErrorMessage(err, 1)).toBe(
      'Gesture Cost rose by 0.500000 ETH while your transaction was in transit. The new required cost is 1.500000 ETH. Please try again.',
    );
  });

  it('returns ICU values for localized dynamic CST cost changes', () => {
    const err = makeRevertError('InsufficientReceivedBidAmount', [
      'gesture cost changed',
      1500000000000000000n,
      1000000000000000000n,
    ]);

    expect(
      getContractErrorDescriptor(err, {
        gestureCurrency: 'CST',
        displayedPriceWei: 1000000000000000000n,
      }),
    ).toEqual({
      key: 'gesture.contractErrors.cstCostChanged',
      values: { required: '1.500000', maximum: '1.000000' },
      errorName: 'InsufficientReceivedBidAmount',
    });
  });

  it('maps known finalize reverts to localized toast keys', () => {
    const err = makeRevertError('MainPrizeEarlyClaim', []);
    expect(getContractErrorDescriptor(err)).toEqual({
      key: 'finalize.contractErrors.mainPrizeEarlyClaim',
      errorName: 'MainPrizeEarlyClaim',
    });
  });

  it('keeps unknown custom errors out of user-facing descriptors', () => {
    expect(getContractErrorDescriptor(makeRevertError('UnknownCustomError', []))).toBeNull();
  });

  // ABI-encoded RoundIsInactive("The current bidding round is not active yet.", actTime, blockTs).
  const ROUND_INACTIVE_DATA =
    '0x16df8bd8' +
    '0000000000000000000000000000000000000000000000000000000000000060' +
    '0000000000000000000000000000000000000000000000000000000067f02202' +
    '0000000000000000000000000000000000000000000000000000000067f021c8' +
    '000000000000000000000000000000000000000000000000000000000000002c' +
    '5468652063757272656e742062696464696e6720726f756e64206973206e6f74' +
    '20616374697665207965742e0000000000000000000000000000000000000000';

  // extractRevertData must recover the bytes so formatCustomContractError can decode them.
  // (formatCustomContractError itself relies on viem's decodeErrorResult, which is mocked
  // out in this jsdom environment, so we assert on the extraction step.)
  it('recovers revert bytes exposed via nested data (provider.data.data)', () => {
    const err = Object.assign(new Error('execution reverted'), {
      name: 'ContractFunctionExecutionError',
      cause: { data: { data: ROUND_INACTIVE_DATA } },
    });
    expect(extractRevertData(err)).toBe(ROUND_INACTIVE_DATA);
  });

  it('recovers revert bytes embedded only in the message text (Hardhat relay)', () => {
    const err = Object.assign(
      new Error(
        `RPC 0x7a69 Custom eth_sendRawTransaction: Error: VM Exception while processing ` +
          `transaction: reverted with an unrecognized custom error (return data: ${ROUND_INACTIVE_DATA})`,
      ),
      { name: 'ContractFunctionExecutionError' },
    );
    expect(extractRevertData(err)).toBe(ROUND_INACTIVE_DATA);
  });

  it('recovers revert bytes nested in a cause message (viem chain)', () => {
    const err = Object.assign(new Error('The contract function reverted.'), {
      name: 'ContractFunctionExecutionError',
      cause: Object.assign(new Error(`... (return data: ${ROUND_INACTIVE_DATA})`), {
        name: 'InternalRpcError',
      }),
    });
    expect(extractRevertData(err)).toBe(ROUND_INACTIVE_DATA);
  });
});
