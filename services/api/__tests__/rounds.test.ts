// lexicon-allow-start: service test fixtures mirror the backend-sealed API surface

import axios from 'axios';

import {
  get_dashboard_info,
  get_round_list,
  get_bid_list,
  get_round_info,
  get_prize_time,
  get_claim_history,
  get_claim_history_by_user,
  get_bid_info,
  get_bid_list_by_round,
  get_current_special_winners,
  get_banned_bids,
  ban_bid,
  unban_gesture,
  get_bid_eth_price,
} from '@/services/api/rounds';

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

const make403 = () =>
  Object.assign(new Error('Forbidden'), {
    response: { status: 403 },
    isAxiosError: true,
  });

const make404 = () =>
  Object.assign(new Error('Not Found'), {
    response: { status: 404 },
    isAxiosError: true,
  });

const mockTx = (id: number) => ({
  EvtLogId: id,
  Tx: {
    EvtLogId: id,
    BlockNum: 100 + id,
    TxId: id,
    TxHash: `0x${id}`,
    TimeStamp: 1700000000 + id,
    DateTime: `2023-01-0${id}`,
  },
});

/** Wire-shaped gesture record: what the strict `GestureInfoSchema` has to accept. */
const mockGesture = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...mockTx(id),
  RoundNum: 7,
  BidderAddr: '0xbidder',
  BidType: 0,
  EthPriceEth: 0.01,
  ...overrides,
});

/** Allocation-claim row: `WinningHistoryEntrySchema` requires the cycle and record type. */
const mockClaim = (id: number) => ({ ...mockTx(id), RoundNum: 3, RecordType: 0 });

/** Dashboard payload with every field the strict schema requires. */
const mockDashboard = (overrides: Record<string, unknown> = {}) => ({
  CurNumBids: 42,
  CurPrizeAmountEth: 1.23,
  CurRoundNum: 17,
  PrizeClaimTs: 1_700_000_000,
  TsRoundStart: 1_699_000_000,
  LastBidderAddr: '0xabc',
  GestureCostEth: 0.001,
  StakingAmountEth: 0.5,
  NumRaffleNFTWinnersBidding: 3,
  NumRaffleNFTWinnersStakingRWalk: 2,
  MainStats: {
    NumCSTokenMints: 1000,
    TotalRaffleEthDeposits: 10,
    TotalCSTConsumedEth: 5,
    TotalMktRewardsEth: 1,
    NumMktRewards: 8,
    TotalRaffleEthWithdrawn: 7,
    NumBidsCST: 200,
    NumUniqueBidders: 50,
    NumUniqueWinners: 20,
    NumUniqueDonors: 10,
    TotalNamedTokens: 30,
    NumUniqueStakersCST: 40,
    NumUniqueStakersRWalk: 25,
    StakeStatisticsCST: { NumActiveStakers: 40, TotalTokensStaked: 400 },
    StakeStatisticsRWalk: { NumActiveStakers: 25, TotalTokensStaked: 300 },
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rounds API', () => {
  describe('get_dashboard_info', () => {
    it('returns data on successful response', async () => {
      const mockData = mockDashboard();
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await get_dashboard_info();

      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/statistics.*dashboard/));
    });

    it('rejects a payload missing a required field instead of passing it through', async () => {
      const bad = mockDashboard();
      delete (bad as { CurRoundNum?: unknown }).CurRoundNum;
      mockedAxios.get.mockResolvedValue({ data: bad });

      await expect(get_dashboard_info()).rejects.toThrow(
        /schemaMismatch:DashboardInfo — CurRoundNum/,
      );
    });

    it('propagates a 400 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_dashboard_info()).rejects.toThrow('Network response was not OK');
    });

    it('propagates a 404 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make404());
      await expect(get_dashboard_info()).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      await expect(get_dashboard_info()).rejects.toThrow('Network Error');
    });

    it('forwards an abort signal to axios', async () => {
      const controller = new AbortController();
      mockedAxios.get.mockResolvedValue({ data: mockDashboard() });

      await get_dashboard_info({ signal: controller.signal });

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });

  describe('get_round_list', () => {
    it('returns array of rounds on successful response', async () => {
      const mockRounds = [
        {
          RoundNum: 1,
          Rounds: [{ RoundNum: 1, ClaimPrizeTx: null }],
        },
      ];
      mockedAxios.get.mockResolvedValue({
        data: { Rounds: mockRounds },
      });

      const result = await get_round_list();

      expect(Array.isArray(result)).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/rounds.*list/));
    });

    it('returns empty array when Rounds is missing', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      expect(await get_round_list()).toEqual([]);
    });

    it('defaults to the full window and honors explicit pagination', async () => {
      mockedAxios.get.mockResolvedValue({ data: { Rounds: [] } });

      await get_round_list();
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        expect.stringMatching(/rounds\/list\/0\/1000000$/),
      );

      await get_round_list({ offset: 10, limit: 25 });
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        expect.stringMatching(/rounds\/list\/10\/25$/),
      );
    });

    it('propagates a 400 instead of resolving to an empty list', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_round_list()).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      await expect(get_round_list()).rejects.toThrow('Network Error');
    });
  });

  describe('get_bid_list', () => {
    it('returns array of gestures on successful response', async () => {
      mockedAxios.get.mockResolvedValue({ data: { Gestures: [mockGesture(1)] } });

      const result = await get_bid_list();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('EvtLogId', 1);
      expect(result[0]).toHaveProperty('TxHash', '0x1');
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/bid.*list/));
    });

    it('accepts CST gestures, which carry no ETH cost', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { Gestures: [mockGesture(2, { BidType: 2, EthPriceEth: -1, CstPriceEth: 411.5 })] },
      });

      const result = await get_bid_list();

      expect(result[0]?.GestureType).toBe(2);
      expect(result[0]?.GestureCostEth).toBeUndefined();
    });

    it('returns empty array when Gestures is missing', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      expect(await get_bid_list()).toEqual([]);
    });

    it('rejects a corrupt gesture anywhere in the list, not just in the first rows', async () => {
      const gestures = [
        ...Array.from({ length: 8 }, (_, i) => mockGesture(i + 1)),
        mockGesture(9, { BidderAddr: 42 }),
      ];
      mockedAxios.get.mockResolvedValue({ data: { Gestures: gestures } });

      await expect(get_bid_list()).rejects.toThrow(/schemaMismatch:GestureInfo\[list\] — 8\./);
    });

    it('propagates a 400 instead of resolving to an empty list', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_bid_list()).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      await expect(get_bid_list()).rejects.toThrow('Network Error');
    });
  });

  describe('get_round_info', () => {
    it('returns flattened round info on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          RoundInfo: {
            RoundNum: 5,
            ClaimPrizeTx: {
              Tx: {
                EvtLogId: 1,
                BlockNum: 200,
                TxId: 1,
                TxHash: '0xr5',
                TimeStamp: 100,
                DateTime: '2023-01-01',
              },
            },
            MainPrize: {
              WinnerAddr: '0xwinner',
              EthAmountEth: 1.5,
              NftTokenId: 42,
              CstAmountEth: 10,
            },
            CharityDeposit: { CharityAddress: '0xcharity', CharityAmountETH: 0.5 },
            StakingDeposit: {
              StakingDepositAmountEth: 0.3,
              StakingPerTokenEth: 0.01,
              StakingNumStakedTokens: 30,
            },
            EnduranceChampion: { WinnerAddr: '0xendurance', NftTokenId: 7, CstAmountEth: 5 },
            LastCstBidder: { WinnerAddr: '0xlast', NftTokenId: 8, CstAmountEth: 3 },
            ChronoWarrior: {
              WinnerAddr: '0xchrono',
              EthAmountEth: 0.2,
              CstAmountEth: 1,
              NftTokenId: 9,
            },
            RoundStats: { TotalBids: 100 },
          },
        },
      });

      const result = await get_round_info(5);

      expect(result).toHaveProperty('RoundNum', 5);
      expect(result).toHaveProperty('WinnerAddr', '0xwinner');
      expect(result).toHaveProperty('TxHash', '0xr5');
      expect(result).toHaveProperty('CharityAddress', '0xcharity');
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/rounds.*info.*5/));
    });

    it('clamps negative roundNum to 0', async () => {
      mockedAxios.get.mockResolvedValue({ data: { RoundInfo: { RoundNum: 0 } } });

      await get_round_info(-3);

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/rounds.*info.*0/));
    });

    it('accepts an unfinalized cycle, which has no claim transaction', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { RoundInfo: { RoundNum: 8, ClaimPrizeTx: null, RoundStats: {} } },
      });

      const result = await get_round_info(8);

      expect(result).toHaveProperty('RoundNum', 8);
      expect(result?.TxHash).toBeUndefined();
    });

    it('rejects a cycle whose allocation amount is not a number', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { RoundInfo: { RoundNum: 8, MainPrize: { EthAmountEth: '1.5' } } },
      });

      await expect(get_round_info(8)).rejects.toThrow(
        /schemaMismatch:RoundInfo\[detail\] — AmountEth/,
      );
    });

    it('propagates a 400 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_round_info(1)).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_round_info(1)).rejects.toThrow('fail');
    });
  });

  describe('get_prize_time', () => {
    it('returns CurRoundPrizeTime on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { CurRoundPrizeTime: 1700001234 } });

      const result = await get_prize_time();

      expect(result).toBe(1700001234);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/rounds.*current.*time/));
    });

    // Required read: a 0 fallback would render an already-elapsed countdown
    // instead of surfacing the failed fetch.
    it('rejects on 400 rather than falling back to 0', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_prize_time()).rejects.toThrow();
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_prize_time()).rejects.toThrow('fail');
    });
  });

  describe('get_claim_history', () => {
    it('returns flattened claim history on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { GlobalPrizeHistory: [mockTx(1), mockTx(2)] },
      });

      const result = await get_claim_history();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('TxHash', '0x1');
      expect(result[1]).toHaveProperty('TxHash', '0x2');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/prizes\/history\/global/),
      );
    });

    it('returns empty array when GlobalPrizeHistory is missing', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      expect(await get_claim_history()).toEqual([]);
    });

    it('propagates a 400 instead of resolving to an empty list', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_claim_history()).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_claim_history()).rejects.toThrow('fail');
    });
  });

  describe('get_claim_history_by_user', () => {
    const addr = '0xabc123';

    it('returns flattened history for the given address', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { USerPrizeHistory: [mockClaim(3)] },
      });

      const result = await get_claim_history_by_user(addr);

      expect(result).toHaveLength(1);
      expect(result![0]).toHaveProperty('TxHash', '0x3');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`prizes/history/by_user/${addr}`)),
      );
    });

    it('returns empty array when USerPrizeHistory is missing', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      expect(await get_claim_history_by_user(addr)).toEqual([]);
    });

    it('propagates a 400 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_claim_history_by_user(addr)).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_claim_history_by_user(addr)).rejects.toThrow('fail');
    });
  });

  describe('get_bid_info', () => {
    it('returns flattened bid on success', async () => {
      mockedAxios.get.mockResolvedValue({ data: { GestureInfo: mockGesture(7) } });

      const result = await get_bid_info(7);

      expect(result).toHaveProperty('TxHash', '0x7');
      expect(result).toHaveProperty('EvtLogId', 7);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/bid.*info.*7/));
    });

    it('normalizes CST cost and reward fields for bid detail payloads', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          BidInfo: {
            BidType: 2,
            CstPriceEth: 411.52783099128,
            CSTRewardEth: 100,
            EthPriceEth: -1e-18,
            BidderAddr: '0x1',
            RoundNum: 0,
            Tx: {
              EvtLogId: 18482,
              BlockNum: 467848129,
              TxId: 5441,
              TxHash: '0x45',
              TimeStamp: 1780045566,
              DateTime: '2026-05-29T09:06:06Z',
            },
          },
        },
      });

      const result = await get_bid_info(18482);

      expect(result?.GestureType).toBe(2);
      expect(result?.CstCost).toBe(411.52783099128);
      expect(result?.NumCSTokensEth).toBe(411.52783099128);
      expect(result?.NumCSTTokensEth).toBe(411.52783099128);
      expect(result?.ParticipationCST).toBe(100);
    });

    it('returns null when GestureInfo is null', async () => {
      mockedAxios.get.mockResolvedValue({ data: { GestureInfo: null } });
      expect(await get_bid_info(99)).toBeNull();
    });

    it('returns null on 404, which means no such gesture', async () => {
      mockedAxios.get.mockRejectedValue(make404());
      expect(await get_bid_info(1)).toBeNull();
    });

    it('propagates a 400 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_bid_info(1)).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_bid_info(1)).rejects.toThrow('fail');
    });
  });

  describe('get_bid_list_by_round', () => {
    it('maps backend BidType to GestureType', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          BidsByRound: [
            {
              BidType: 2,
              CstPriceEth: 40,
              CSTRewardEth: 100,
              EthPriceEth: -1,
              BidderAddr: '0x1',
              RoundNum: 0,
              Tx: {
                EvtLogId: 1,
                BlockNum: 1,
                TxId: 1,
                TxHash: '0x1',
                TimeStamp: 1,
                DateTime: '',
              },
            },
          ],
        },
      });

      const result = await get_bid_list_by_round(0, 'desc');

      expect(result[0]?.GestureType).toBe(2);
      expect(result[0]?.CstCost).toBe(40);
      expect(result[0]?.NumCSTokensEth).toBe(40);
      expect(result[0]?.NumCSTTokensEth).toBe(40);
      expect(result[0]?.ParticipationCST).toBe(100);
    });

    it('maps "asc" sort direction to 0', async () => {
      mockedAxios.get.mockResolvedValue({ data: { BidsByRound: [mockGesture(1)] } });

      const result = await get_bid_list_by_round(5, 'asc');

      expect(result).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/bid.*list.*by_round.*5.*0.*0.*1000000/),
      );
    });

    it('maps "desc" sort direction to 1', async () => {
      mockedAxios.get.mockResolvedValue({ data: { BidsByRound: [] } });

      await get_bid_list_by_round(3, 'desc');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/bid.*list.*by_round.*3.*1.*0.*1000000/),
      );
    });

    it('maps unknown sort direction to 1', async () => {
      mockedAxios.get.mockResolvedValue({ data: { BidsByRound: [] } });

      await get_bid_list_by_round(1, 'random');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/by_round.*1.*1.*0.*1000000/),
      );
    });

    it('honors an explicit server-side pagination window', async () => {
      mockedAxios.get.mockResolvedValue({ data: { BidsByRound: [] } });

      await get_bid_list_by_round(5, 'asc', { offset: 40, limit: 20 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/bid\/list\/by_round\/5\/0\/40\/20$/),
      );
    });

    it('propagates a 400 instead of resolving to an empty list', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_bid_list_by_round(1, 'asc')).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_bid_list_by_round(1, 'asc')).rejects.toThrow('fail');
    });
  });

  describe('get_current_special_winners', () => {
    it('returns special recipients on success', async () => {
      const recipients = {
        ChronoWarriorAddress: '0x30E6E8EEEC88aA8Ea35B54807671458B3F01665e',
        ChronoWarriorDuration: 1551,
        EnduranceChampionAddress: '0x30E6E8EEEC88aA8Ea35B54807671458B3F01665e',
        EnduranceChampionDuration: 704,
        LastBidderAddress: '0x4A9A3815060C3Bd08fb4d44C9e74513874771b0C',
        LastBidderLastBidTime: 1778207543,
        LastCstBidderAddress: '0xC83aa25FA5829c789DF2AC5976b4A26d49c648FF',
      };
      mockedAxios.get.mockResolvedValue({ data: recipients });

      const result = await get_current_special_winners();

      expect(result).toEqual(recipients);
      expect(result?.ChronoWarriorAddress).toBe(recipients.ChronoWarriorAddress);
      expect(result?.LastBidderLastBidTime).toBe(1778207543);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/bid.*current_special_winners/),
      );
    });

    it('propagates a 400 instead of resolving to null', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      await expect(get_current_special_winners()).rejects.toThrow('Network response was not OK');
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_current_special_winners()).rejects.toThrow('fail');
    });
  });

  describe('get_banned_bids', () => {
    it('returns banned gestures from the main API', async () => {
      const gestures = [{ BidId: 1, UserAddr: '0x1' }];
      mockedAxios.get.mockResolvedValue({ data: gestures });

      const result = await get_banned_bids();

      expect(result).toEqual(gestures);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/get_banned_bids/));
    });

    it('returns empty array on 400 response', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_banned_bids()).toEqual([]);
    });

    it('returns empty array on 403 response', async () => {
      mockedAxios.get.mockRejectedValue(make403());
      expect(await get_banned_bids()).toEqual([]);
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_banned_bids()).rejects.toThrow('Network response was not OK');
    });
  });

  describe('ban_bid', () => {
    it('posts ban request with bid_id and user_addr', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await ban_bid(42, '0xuser');

      expect(result).toEqual({ success: true });
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringMatching(/ban_bid/), {
        bid_id: 42,
        user_addr: '0xuser',
      });
    });

    it('throws on server error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Server Error'));
      await expect(ban_bid(1, '0x1')).rejects.toThrow('Network response was not OK');
    });
  });

  describe('unban_gesture', () => {
    it('posts unban request with bid_id', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await unban_gesture(42);

      expect(result).toEqual({ success: true });
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringMatching(/unban_bid/), {
        bid_id: 42,
      });
    });

    it('throws on server error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Server Error'));
      await expect(unban_gesture(1)).rejects.toThrow('Network response was not OK');
    });
  });

  describe('get_bid_eth_price', () => {
    it('returns bid ETH price info on success', async () => {
      const priceInfo = { GestureCostEth: 0.5, BidPriceWei: '500000000000000000' };
      mockedAxios.get.mockResolvedValue({ data: priceInfo });

      const result = await get_bid_eth_price();

      expect(result).toEqual(priceInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringMatching(/bid.*eth_price/));
    });

    it('returns null on 400 response', async () => {
      mockedAxios.get.mockRejectedValue(make400());
      expect(await get_bid_eth_price()).toBeNull();
    });

    it('throws on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(get_bid_eth_price()).rejects.toThrow('Network response was not OK');
    });
  });
});

// lexicon-allow-end
