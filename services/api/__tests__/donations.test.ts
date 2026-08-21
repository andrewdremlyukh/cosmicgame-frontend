// lexicon-allow-start: service test fixtures mirror the backend-sealed API surface

import axios from 'axios';

import {
  get_donations_cg_with_info_list,
  get_donations_cg_with_info_by_round,
  get_donations_with_info_by_id,
  get_donations_both_by_round,
  get_donations_both,
  get_charity_cg_deposits,
  get_charity_voluntary,
  get_charity_withdrawals,
  get_donations_nft_list,
  get_claimed_donated_nft_by_user,
  get_donations_nft_by_round,
  get_unclaimed_donated_nft_by_user,
  get_donations_erc20_by_round,
  get_donations_erc20_by_user,
} from '@/services/api/donations';

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

describe('donations API', () => {
  describe('get_donations_cg_with_info_list', () => {
    it('returns flattened data on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { DirectCGDonations: [{ EvtLogId: 2 }] } });
      const result = await get_donations_cg_with_info_list();
      expect(result).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*eth.*with_info.*list/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_cg_with_info_list()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_cg_with_info_list()).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });

  describe('get_donations_cg_with_info_by_round', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { DirectCGDonations: [] } });
      await get_donations_cg_with_info_by_round(3);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*eth.*with_info.*by_round.*3/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_cg_with_info_by_round(3)).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_cg_with_info_by_round(3)).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });

  describe('get_donations_with_info_by_id', () => {
    it('returns flattened single donation', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { ETHDonation: { EvtLogId: 10, Tx: { ...TX, TxHash: '0xb' } } },
      });
      const result = await get_donations_with_info_by_id(10);
      expect(result).toHaveProperty('TxHash', '0xb');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*eth.*with_info.*info.*10/),
      );
    });

    it('returns null on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_with_info_by_id(10)).toBeNull();
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_with_info_by_id(10)).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });

  describe('get_donations_both_by_round', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CosmicGameDonations: [] } });
      await get_donations_both_by_round(7);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*eth.*both.*by_round.*7/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_both_by_round(7)).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_both_by_round(7)).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_donations_both', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CosmicGameDonations: [] } });
      await get_donations_both();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*eth.*both.*all/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_both()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_both()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_charity_cg_deposits', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CharityDonations: [] } });
      await get_charity_cg_deposits();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*charity.*cg_deposits/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_charity_cg_deposits()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_charity_cg_deposits()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_charity_voluntary', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CharityDonations: [] } });
      await get_charity_voluntary();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*charity.*voluntary/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_charity_voluntary()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_charity_voluntary()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_charity_withdrawals', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CharityWithdrawals: [] } });
      await get_charity_withdrawals();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*charity.*withdrawals/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_charity_withdrawals()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_charity_withdrawals()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_donations_nft_list', () => {
    it('returns normalized flattened data', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { NFTDonations: [{ EvtLogId: 1, TokenAddress: '0xT' }] },
      });
      const result = (await get_donations_nft_list()) as Array<{ TokenAddr: string }>;
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('TokenAddr', '0xT');
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/donations.*nft.*list/));
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_nft_list()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_nft_list()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_claimed_donated_nft_by_user', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { DonatedNFTClaims: [] } });
      await get_claimed_donated_nft_by_user('0xuser');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*nft.*claims.*by_user.*0xuser/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_claimed_donated_nft_by_user('0xuser')).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_claimed_donated_nft_by_user('0xuser')).rejects.toThrow(
        'Network response was not OK',
      );
    });
  });

  describe('get_donations_nft_by_round', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { NFTDonations: [] } });
      await get_donations_nft_by_round(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*nft.*by_round.*2/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_nft_by_round(2)).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_nft_by_round(2)).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_unclaimed_donated_nft_by_user', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { UnclaimedDonatedNFTs: [] } });
      await get_unclaimed_donated_nft_by_user('0xaddr');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*nft.*unclaimed.*by_user.*0xaddr/),
      );
    });

    it('propagates a 400 rather than reporting nothing to collect', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_unclaimed_donated_nft_by_user('0xaddr')).rejects.toThrow(
        'Network response was not OK',
      );
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_unclaimed_donated_nft_by_user('0xaddr')).rejects.toThrow('fail');
    });

    it('preserves donation index and NFT identity fields', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          UnclaimedDonatedNFTs: [
            {
              Tx: TX,
              Index: 17,
              RoundNum: 6,
              TokenAddr: '0xNFT',
              NFTTokenId: 123,
              NFTTokenURI: 'ipfs://nft',
            },
          ],
        },
      });

      const result = await get_unclaimed_donated_nft_by_user('0xaddr');
      expect(result[0]).toEqual(
        expect.objectContaining({
          Index: 17,
          RoundNum: 6,
          TokenAddr: '0xNFT',
          NFTTokenId: 123,
          NFTTokenURI: 'ipfs://nft',
          TxHash: '0xa',
        }),
      );
    });
  });

  describe('get_donations_erc20_by_round', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { DonationsERC20ByRoundAll: [] } });
      await get_donations_erc20_by_round(6);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*erc20.*by_round.*all.*6/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_erc20_by_round(6)).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_erc20_by_round(6)).rejects.toThrow('Network response was not OK');
    });

    it('maps AmountEth onto AmountDonatedEth when AmountDonatedEth is absent', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          DonationsERC20ByRoundAll: [
            {
              RoundNum: 6,
              TokenAddr: '0x1111111111111111111111111111111111111111',
              AmountEth: 1.25,
              Tx: TX,
            },
          ],
        },
      });
      const result = await get_donations_erc20_by_round(6);
      expect(result).toHaveLength(1);
      expect(result[0]!.AmountDonatedEth).toBe(1.25);
      expect(result[0]!.AmountClaimedEth).toBe(0);
      expect(result[0]!.WinnerAddr).toBe('');
    });
  });

  describe('get_donations_erc20_by_user', () => {
    it('calls correct endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: { DonatedPrizesERC20ByWinner: [] } });
      await get_donations_erc20_by_user('0xwinner');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/donations.*erc20.*by_user.*0xwinner/),
      );
    });

    it('returns empty array on 400', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_donations_erc20_by_user('0xwinner')).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_donations_erc20_by_user('0xwinner')).rejects.toThrow(
        'Network response was not OK',
      );
    });

    it('preserves raw ERC20 claim fields alongside display fields', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          DonatedPrizesERC20ByWinner: [
            {
              Tx: TX,
              RoundNum: 0,
              TokenAddr: '0xToken',
              AmountDonated: '1999999999999999994000',
              AmountDonatedEth: 2000,
              AmountClaimed: '6000',
              AmountClaimedEth: 0.000000000000006,
              DonateClaimDiff: '1999999999999999988000',
              DonateClaimDiffEth: 2000,
              WinnerAddr: '0xwinner',
              Claimed: false,
            },
          ],
        },
      });

      const result = await get_donations_erc20_by_user('0xwinner');
      expect(result[0]).toEqual(
        expect.objectContaining({
          AmountDonated: '1999999999999999994000',
          AmountDonatedEth: 2000,
          AmountClaimed: '6000',
          AmountClaimedEth: 0.000000000000006,
          DonateClaimDiff: '1999999999999999988000',
          DonateClaimDiffEth: '2000',
          Claimed: false,
          WinnerAddr: '0xwinner',
        }),
      );
    });
  });
});

// lexicon-allow-end
