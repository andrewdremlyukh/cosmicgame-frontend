import { protocolFacts } from '@/content/protocol-facts';

import { COSMIC_SIGNATURE_MARKETPLACE_URL } from '@/config/marketplace';
import { CST_UNISWAP_SWAP_URL } from '@/config/uniswap';

import { render, screen, fireEvent, waitFor, checkA11y } from '@/test-utils';

import Contracts from '../Contracts';

interface LiveCstPreviewTestGlobals {
  __COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__?: boolean;
  __COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__?: number;
}

/* ── framer-motion mock ───────────────────────────────────────── */

jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ..._rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
    section: ({
      children,
      className,
      ...rest
    }: React.HTMLAttributes<HTMLElement> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => (
      <section className={className} data-testid="motion-section" aria-label={rest['aria-label']}>
        {children}
      </section>
    ),
  },
}));

/* ── viem mock ─────────────────────────────────────────────────── */

jest.mock('viem', () => ({
  formatEther: (v: bigint) => (Number(v) / 1e18).toString(),
}));

/* ── utils mock ────────────────────────────────────────────────── */

jest.mock('../../../../../utils', () => ({
  formatEthValue: (value: number) => (value ? `${value.toFixed(4)} ETH` : '0 ETH'),
  formatSeconds: (s: number) => (s > 0 ? `${s}s` : '0s'),
  shortenHex: (hex: string, length = 4) =>
    hex ? `${hex.substring(0, length + 2)}....${hex.substring(hex.length - length)}` : '',
}));

/* ── next/link mock ────────────────────────────────────────────── */

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock('@wagmi/core', () => ({
  writeContract: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 421614,
  useConfig: () => ({}),
  usePublicClient: () => undefined,
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

/* ── useApiQuery mock ──────────────────────────────────────────── */

const mockUseDashboardInfo = jest.fn().mockReturnValue({
  data: undefined,
  isLoading: false,
});

jest.mock('../../../../../hooks/useApiQuery', () => ({
  useDashboardInfo: (...args: unknown[]) => mockUseDashboardInfo(...args),
}));

/* ── useRequireChain mock (PublicGoodsVaultAction gates its write on it) ── */

jest.mock('../../../../../hooks/useRequireChain', () => ({
  useRequireChain: () => ({
    requiredChainId: 421614,
    connectedChainId: 421614,
    isWrongChain: false,
    isConnected: true,
    switchToRequiredChain: jest.fn(),
    ensureCorrectChain: jest.fn().mockResolvedValue(true),
  }),
}));

/* ── useContractNoSigner mock ──────────────────────────────────── */

const mockUseContractNoSigner = jest.fn().mockReturnValue(null);

jest.mock('../../../../../hooks/useContractNoSigner', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseContractNoSigner(...args),
}));

/* ── config/networks mock ──────────────────────────────────────── */

jest.mock('../../../../../config/networks', () => ({
  networkConfig: {
    chainName: 'Arbitrum Sepolia',
    chainId: 421614,
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  getPublicClientRpcUrl: () => 'http://127.0.0.1:8545',
  emptyContractAddresses: () => ({
    randomWalkNft: '',
    cosmicGame: '',
    cosmicSignature: '',
    cosmicToken: '',
    cosmicDao: '',
    charity: '',
    prizesWallet: '',
    stakingCst: '',
    stakingRwalk: '',
    marketing: '',
    implementation: '',
  }),
  publishDashboardContractAddresses: jest.fn(),
  getCachedDashboardContractAddresses: () => ({
    randomWalkNft: '0x0',
    cosmicGame: '0xGame',
    cosmicSignature: '0x0',
    cosmicToken: '0x0',
    cosmicDao: '0x0',
    charity: '0xCharity',
    prizesWallet: '0x0',
    stakingCst: '0x0',
    stakingRwalk: '0x0',
    marketing: '0x0',
    implementation: '0x0',
  }),
}));

/* ── contracts/abis mock ──────────────────────────────────────── */

jest.mock('../../../../../contracts/abis', () => ({
  charityWalletAbi: [],
  cosmicGameAbi: [],
}));

/* ── utils/errors mock ─────────────────────────────────────────── */

jest.mock('../../../../../utils/errors', () => ({
  reportError: jest.fn(),
}));

/* ── clipboard mock ────────────────────────────────────────────── */

const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

/* ── helpers ───────────────────────────────────────────────────── */

const makeDashboardData = (overrides = {}) => ({
  PrizePercentage: 25,
  ChronoWarriorPercentage: 10,
  RafflePercentage: 25,
  StakingPercentage: 30,
  CharityPercentage: 10,
  CharityBalanceEth: 0.5,
  NumRaffleEthRecipientsBidding: 5,
  NumRaffleNFTRecipientsBidding: 3,
  NumRaffleNFTRecipientsStakingRWalk: 2,
  TimeoutClaimPrize: 86400,
  ContractAddrs: {
    CosmicGameAddr: '0xGameAddr',
    CosmicTokenAddr: '0xTokenAddr',
    CosmicSignatureAddr: '0xSigAddr',
    RandomWalkAddr: '0xRWAddr',
    CosmicDaoAddr: '0xDaoAddr',
    CharityWalletAddr: '0xCharityAddr',
    MarketingWalletAddr: '0xMktAddr',
    PrizesWalletAddr: '0xPrizesAddr',
    StakingWalletCSTAddr: '0xStakeCSTAddr',
    StakingWalletRWalkAddr: '0xStakeRWLKAddr',
    ImplementationAddr: '0x7739148013777c485AD9f3d971e1005Eca686661',
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteText.mockClear();
  mockUseContractNoSigner.mockReturnValue(null);
  const liveCstGlobals = globalThis as LiveCstPreviewTestGlobals;
  liveCstGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = false;
  liveCstGlobals.__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__ = undefined;
});

/* ── Tests ─────────────────────────────────────────────────────── */

describe('Contracts', () => {
  it('renders page header with correct title', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(
      screen.getByRole('heading', { name: 'Contract Addresses', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders network badge with chain name and ID', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('Arbitrum Sepolia')).toBeInTheDocument();
    expect(screen.getByText('Chain 421614')).toBeInTheDocument();
  });

  it('renders allocation tracks section with percentages', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('Allocation Tracks')).toBeInTheDocument();
    expect(screen.getByText('Signature Allocation')).toBeInTheDocument();
    expect(screen.getByText('Chrono-Warrior')).toBeInTheDocument();
    expect(screen.getByText('Stellar Selection')).toBeInTheDocument();
    expect(screen.getByText('Anchor Distribution')).toBeInTheDocument();
    expect(screen.getByText('Public Goods')).toBeInTheDocument();
  });

  it('renders game configuration section', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('Protocol Configuration')).toBeInTheDocument();
    expect(screen.getByText('ETH Gesture-Cost Step-Up')).toBeInTheDocument();
    expect(screen.getByText('Time Increment')).toBeInTheDocument();
    expect(screen.getByText('Current Participation CST Preview')).toBeInTheDocument();
  });

  it('renders all contract address groups', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('Core Contracts')).toBeInTheDocument();
    expect(screen.getByText('Wallet Contracts')).toBeInTheDocument();
    expect(screen.getByText('Anchoring Contracts')).toBeInTheDocument();
  });

  it('renders contract address cards', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('Implementation Contract')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Signature CST Token')).toBeInTheDocument();
    expect(screen.getByText('Public Goods Vault')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Signature NFT Anchoring Wallet')).toBeInTheDocument();
  });

  it('links the CST token card to the Uniswap swap page', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);

    expect(screen.getByRole('link', { name: 'nav.ecosystem.uniswap.ariaLabel' })).toHaveAttribute(
      'href',
      CST_UNISWAP_SWAP_URL,
    );
  });

  it('links the Cosmic Signature NFT card to the marketplace', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);

    expect(screen.getByRole('link', { name: 'nav.ecosystem.axiomZero.ariaLabel' })).toHaveAttribute(
      'href',
      COSMIC_SIGNATURE_MARKETPLACE_URL,
    );
  });

  it('renders the verified implementation address over a stale dashboard value', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);

    expect(screen.getByText(protocolFacts.contractAddresses.implementation)).toBeInTheDocument();
    expect(
      screen.queryByText('0x7739148013777c485AD9f3d971e1005Eca686661'),
    ).not.toBeInTheDocument();
  });

  it('renders calibration parameters section', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(
      screen.getByText('Calibration Window & Stellar Selection Parameters'),
    ).toBeInTheDocument();
    expect(screen.getByText('CST Calibration Window')).toBeInTheDocument();
    expect(screen.getByText('ETH Calibration Window')).toBeInTheDocument();
  });

  it('renders dynamic CST calibration duration from contract reads', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    mockUseContractNoSigner.mockReturnValue({
      read: {
        bidMessageLengthMaxLimit: jest.fn().mockResolvedValue(280n),
        ethBidPriceIncreaseDivisor: jest.fn().mockResolvedValue(100n),
        mainPrizeTimeIncrementIncreaseDivisor: jest.fn().mockResolvedValue(100n),
        mainPrizeTimeIncrementInMicroSeconds: jest.fn().mockResolvedValue(1_000_000n),
        getInitialDurationUntilMainPrize: jest.fn().mockResolvedValue(3600n),
        getBidCstRewardAmount: jest.fn().mockResolvedValue(100000000000000000000n),
        getCstDutchAuctionDurations: jest.fn().mockResolvedValue([43200n, 1200n]),
        getEthDutchAuctionDurations: jest.fn().mockResolvedValue([7200n, 300n]),
        cstDutchAuctionBeginningBidPriceMinLimit: jest.fn().mockResolvedValue(1000000000000000000n),
        charityAddress: jest.fn().mockResolvedValue('0xCharityBeneficiary'),
      },
    });

    render(<Contracts />);

    await waitFor(() => {
      expect(screen.getByText('43200s')).toBeInTheDocument();
      expect(screen.getByText('1200s')).toBeInTheDocument();
    });
  });

  it('renders the divisor-derived percentages from contract reads', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    mockUseContractNoSigner.mockReturnValue({
      read: {
        bidMessageLengthMaxLimit: jest.fn().mockResolvedValue(280n),
        ethBidPriceIncreaseDivisor: jest.fn().mockResolvedValue(50n),
        mainPrizeTimeIncrementIncreaseDivisor: jest.fn().mockResolvedValue(100n),
        mainPrizeTimeIncrementInMicroSeconds: jest.fn().mockResolvedValue(1_000_000n),
        getInitialDurationUntilMainPrize: jest.fn().mockResolvedValue(3600n),
        getBidCstRewardAmount: jest.fn().mockResolvedValue(100000000000000000000n),
        getCstDutchAuctionDurations: jest.fn().mockResolvedValue([43200n, 1200n]),
        getEthDutchAuctionDurations: jest.fn().mockResolvedValue([7200n, 300n]),
        cstDutchAuctionBeginningBidPriceMinLimit: jest.fn().mockResolvedValue(1000000000000000000n),
        charityAddress: jest.fn().mockResolvedValue('0xCharityBeneficiary'),
      },
    });

    render(<Contracts />);

    await waitFor(() => expect(screen.getByText('2%')).toBeInTheDocument());
  });

  it('never shows Infinity% when the contract returns a zero divisor', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    mockUseContractNoSigner.mockReturnValue({
      read: {
        bidMessageLengthMaxLimit: jest.fn().mockResolvedValue(280n),
        ethBidPriceIncreaseDivisor: jest.fn().mockResolvedValue(0n),
        mainPrizeTimeIncrementIncreaseDivisor: jest.fn().mockResolvedValue(0n),
        mainPrizeTimeIncrementInMicroSeconds: jest.fn().mockResolvedValue(1_000_000n),
        getInitialDurationUntilMainPrize: jest.fn().mockResolvedValue(3600n),
        getBidCstRewardAmount: jest.fn().mockResolvedValue(100000000000000000000n),
        getCstDutchAuctionDurations: jest.fn().mockResolvedValue([43200n, 1200n]),
        getEthDutchAuctionDurations: jest.fn().mockResolvedValue([7200n, 300n]),
        cstDutchAuctionBeginningBidPriceMinLimit: jest.fn().mockResolvedValue(1000000000000000000n),
        charityAddress: jest.fn().mockResolvedValue('0xCharityBeneficiary'),
      },
    });

    render(<Contracts />);

    await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument());
    expect(screen.queryByText('Infinity%')).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('leaves the percentages alone when the divisor read is unusable', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    mockUseContractNoSigner.mockReturnValue({
      read: {
        bidMessageLengthMaxLimit: jest.fn().mockResolvedValue(280n),
        ethBidPriceIncreaseDivisor: jest.fn().mockResolvedValue('not-a-number'),
        mainPrizeTimeIncrementIncreaseDivisor: jest.fn().mockResolvedValue('not-a-number'),
        mainPrizeTimeIncrementInMicroSeconds: jest.fn().mockResolvedValue(1_000_000n),
        getInitialDurationUntilMainPrize: jest.fn().mockResolvedValue(3600n),
        getBidCstRewardAmount: jest.fn().mockResolvedValue(100000000000000000000n),
        getCstDutchAuctionDurations: jest.fn().mockResolvedValue([43200n, 1200n]),
        getEthDutchAuctionDurations: jest.fn().mockResolvedValue([7200n, 300n]),
        cstDutchAuctionBeginningBidPriceMinLimit: jest.fn().mockResolvedValue(1000000000000000000n),
        charityAddress: jest.fn().mockResolvedValue('0xCharityBeneficiary'),
      },
    });

    render(<Contracts />);

    await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument());
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('refreshes the participation CST preview live', async () => {
    const liveCstGlobals = globalThis as LiveCstPreviewTestGlobals;
    liveCstGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = true;
    liveCstGlobals.__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__ = 20;
    const rewardValues = [BigInt('100000000000000000000'), BigInt('125123456789123000000')];
    let rewardReadCount = 0;
    const readParticipationCstPreview = jest.fn(async () => {
      return rewardValues[Math.min(rewardReadCount++, rewardValues.length - 1)]!;
    });

    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    mockUseContractNoSigner.mockReturnValue({
      read: {
        bidMessageLengthMaxLimit: jest.fn().mockResolvedValue(280n),
        ethBidPriceIncreaseDivisor: jest.fn().mockResolvedValue(100n),
        mainPrizeTimeIncrementIncreaseDivisor: jest.fn().mockResolvedValue(100n),
        mainPrizeTimeIncrementInMicroSeconds: jest.fn().mockResolvedValue(1_000_000n),
        getInitialDurationUntilMainPrize: jest.fn().mockResolvedValue(3600n),
        getBidCstRewardAmount: readParticipationCstPreview,
        getCstDutchAuctionDurations: jest.fn().mockResolvedValue([43200n, 1200n]),
        getEthDutchAuctionDurations: jest.fn().mockResolvedValue([7200n, 300n]),
        cstDutchAuctionBeginningBidPriceMinLimit: jest.fn().mockResolvedValue(1000000000000000000n),
        charityAddress: jest.fn().mockResolvedValue('0xCharityBeneficiary'),
      },
    });

    render(<Contracts />);

    await waitFor(() => {
      expect(screen.getByText('125.1235 CST')).toBeInTheDocument();
    });
    expect(readParticipationCstPreview.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('renders stellar selection configuration cards', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByText('ETH Stellar Selection Recipients')).toBeInTheDocument();
    expect(screen.getByText('NFT Stellar Selection (Participants)')).toBeInTheDocument();
    expect(screen.getByText('NFT Stellar Selection (Anchored RWLK)')).toBeInTheDocument();
  });

  it('renders search input for contract addresses', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    expect(screen.getByLabelText('Search contracts')).toBeInTheDocument();
  });

  it('filters contracts when searching', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    const searchInput = screen.getByLabelText('Search contracts');
    fireEvent.change(searchInput, { target: { value: 'charity' } }); // lexicon-allow-line
    expect(screen.getByText('Public Goods Vault')).toBeInTheDocument();
    expect(screen.queryByText('Cosmic Signature CST Token')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no results', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    const searchInput = screen.getByLabelText('Search contracts');
    fireEvent.change(searchInput, { target: { value: 'zzzznotfound' } });
    expect(screen.getByText(/No contracts match/)).toBeInTheDocument();
  });

  it('renders explorer links for contracts', () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    const explorerLinks = screen.getAllByLabelText(/View .+ on block explorer/);
    expect(explorerLinks.length).toBeGreaterThan(0);
    expect(explorerLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('copies contract address when copy button is clicked', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    render(<Contracts />);
    const copyButtons = screen.getAllByLabelText(/Copy .+ address/);
    fireEvent.click(copyButtons[0]!);
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('renders loading state with skeletons', () => {
    mockUseDashboardInfo.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<Contracts />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    mockUseDashboardInfo.mockReturnValue({ data: makeDashboardData(), isLoading: false });
    const { container } = render(<Contracts />);
    await checkA11y(container, { rules: { 'heading-order': { enabled: false } } });
  });
});
