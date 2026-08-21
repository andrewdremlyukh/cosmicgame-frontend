// lexicon-allow-start: service test fixtures mirror the backend-sealed API surface

import axios from 'axios';

import {
  get_raffle_deposits_by_user,
  get_unclaimed_raffle_deposits_by_user,
  get_raffle_nft_winnings_by_user,
} from '@/services/api/stellarSelection';

jest.mock('axios', () => {
  const actual = jest.requireActual<typeof import('axios')>('axios');
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: { response: { use: jest.fn() } },
      defaults: {},
    },
    isAxiosError: actual.isAxiosError,
  };
});
jest.mock('../../../utils/errors', () => ({ reportError: jest.fn() }));
const mockedAxios = axios as jest.Mocked<typeof axios>;

const make400 = () =>
  Object.assign(new Error('Bad Request'), {
    response: { status: 400 },
    isAxiosError: true,
  });

const TX = { EvtLogId: 1, BlockNum: 1, TxId: 1, TxHash: '0xa', TimeStamp: 1, DateTime: '' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('stellarSelection API', () => {
  describe('get_raffle_deposits_by_user', () => {
    it('returns flattened deposits on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { UserRaffleDeposits: [{ EvtLogId: 1, Tx: TX }] },
      });
      const result = await get_raffle_deposits_by_user('0xabc');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('TxHash', '0xa');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/prizes\/eth\/raffle\/by_user.*0xabc/),
      );
    });

    it('accepts RaffleDeposits key from primary Go JSON API', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { RaffleDeposits: [{ EvtLogId: 2, Tx: TX }] },
      });
      const result = await get_raffle_deposits_by_user('0xabc');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('TxHash', '0xa');
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_raffle_deposits_by_user('0xabc')).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_raffle_deposits_by_user('0xabc')).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });

  describe('get_unclaimed_raffle_deposits_by_user', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { UnclaimedDeposits: [] } });
      await get_unclaimed_raffle_deposits_by_user('0xghi');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/prizes\/eth\/unclaimed\/by_user.*0xghi/),
      );
    });

    it('propagates a 400 rather than reporting nothing to collect', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_unclaimed_raffle_deposits_by_user('0xghi')).rejects.toThrow(
        'Network response was not OK',
      );
    });

    it('rejects a deposit row with a non-numeric amount', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { UnclaimedDeposits: [{ Amount: '0.5', RoundNum: 3 }] },
      });

      await expect(get_unclaimed_raffle_deposits_by_user('0xghi')).rejects.toThrow(
        /schemaMismatch:unclaimedRaffleDepositsByUser — 0\.Amount/,
      );
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_unclaimed_raffle_deposits_by_user('0xghi')).rejects.toThrow('fail');
    });
  });

  describe('get_raffle_nft_winnings_by_user', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { UserRaffleNFTWinnings: [] } });
      await get_raffle_nft_winnings_by_user('0xwinner');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/raffle\/nft\/by_user.*0xwinner/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_raffle_nft_winnings_by_user('0xwinner')).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_raffle_nft_winnings_by_user('0xwinner')).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });
});

// lexicon-allow-end
