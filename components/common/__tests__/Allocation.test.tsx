import '@testing-library/jest-dom';

import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import Prize from '@/components/common/Allocation';

import { checkA11y, render, screen } from '@/test-utils';

// Signature Allocation NFT count baked into the copy (V3: 3, V2: 1).
const cscNftCount = isV3Mechanics ? protocolFacts.v3.mainPrizeNftsPerCycleDefault : 1;

const mockData = {
  PrizeAmountEth: 1.5,
  RaffleAmountEth: 0.5,
  NumRaffleEthWinnersBidding: 5,
  NumRaffleNFTWinnersBidding: 3,
  NumRaffleNFTWinnersStakingRWalk: 2,
  StakingAmountEth: 0.75,
  CosmicGameBalanceEth: 10,
  ChronoWarriorPercentage: 5,
  CharityPercentage: 7,
};

describe('Allocation Breakdown', () => {
  it('renders section heading', () => {
    render(<Prize data={mockData} />);
    expect(screen.getByText('home.allocation.title')).toBeInTheDocument();
  });

  it('renders Signature Allocation link', () => {
    render(<Prize data={mockData} />);
    const main = screen.getByText('home.allocation.cards.signature.name');
    expect(main.closest('a')).toHaveAttribute('href', '/faq#main-allocation');
  });

  it('renders Chrono-Warrior Allocation link', () => {
    render(<Prize data={mockData} />);
    const chrono = screen.getByText('home.allocation.cards.chronoWarrior.name');
    expect(chrono.closest('a')).toHaveAttribute('href', '/faq#chrono-warrior');
  });

  it('renders Endurance Champion link', () => {
    render(<Prize data={mockData} />);
    const endurance = screen.getByText('home.allocation.cards.endurance.name');
    expect(endurance.closest('a')).toHaveAttribute('href', '/faq#endurance-champion');
  });

  it('sets target="_blank" on all FAQ links', () => {
    render(<Prize data={mockData} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
    }
  });

  it('sets rel="noopener noreferrer" on all target="_blank" links', () => {
    render(<Prize data={mockData} />);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('displays allocation amounts from data', () => {
    render(<Prize data={mockData} />);
    expect(screen.getByText('home.allocation.amounts.eth(amount=1.5000)')).toBeInTheDocument();
    expect(screen.getByText('home.allocation.amounts.eth(amount=0.7500)')).toBeInTheDocument();
  });

  it('renders Public Goods with current-cycle amount and Protocol Guild label', () => {
    render(<Prize data={mockData} />);
    const publicGoods = screen.getByText('home.allocation.cards.publicGoods.name');
    expect(publicGoods.closest('a')).toHaveAttribute('href', '/faq');
    expect(screen.getByText('home.allocation.amounts.eth(amount=0.7000)')).toBeInTheDocument();
    expect(
      screen.getByText('home.allocation.cards.publicGoods.recipientLabel'),
    ).toBeInTheDocument();
  });

  it('displays Stellar Selection recipient counts', () => {
    render(<Prize data={mockData} />);
    expect(screen.getByText('home.allocation.recipientCount(count=5)')).toBeInTheDocument();
    expect(screen.getByText('home.allocation.recipientCount(count=3)')).toBeInTheDocument();
    expect(screen.getByText('home.allocation.recipientCount(count=2)')).toBeInTheDocument();
    expect(screen.getAllByText('home.allocation.recipientCount(count=1)')).toHaveLength(4);
    expect(
      screen.getByText('home.allocation.cards.cosmicAnchor.recipientLabel'),
    ).toBeInTheDocument();
  });

  it('calculates Chrono-Warrior ETH correctly', () => {
    render(<Prize data={mockData} />);
    const expected = ((10 * 5) / 100).toFixed(4);
    expect(screen.getByText(`home.allocation.amounts.eth(amount=${expected})`)).toBeInTheDocument();
  });

  it('shows fixed Recognition CST amount for Endurance Champion and Final CST Gesture', () => {
    render(<Prize data={mockData} />);
    const cstAmounts = screen.getAllByText('home.allocation.amounts.fixedCst');
    expect(cstAmounts.length).toBe(4);
    expect(screen.getAllByText('home.allocation.amounts.fixedCstEach')).toHaveLength(2);
  });

  it('shows Chrono-Warrior ETH, CST, and NFT pieces', () => {
    render(<Prize data={mockData} />);
    expect(screen.getByText('home.allocation.cards.chronoWarrior.name')).toBeInTheDocument();
    expect(screen.getByText('home.allocation.amounts.eth(amount=0.5000)')).toBeInTheDocument();
    expect(screen.getAllByText('home.allocation.amounts.fixedCst')).toHaveLength(4);
    expect(screen.getAllByText('home.allocation.amounts.nft')).toHaveLength(3);
    expect(
      screen.getByText(`home.allocation.amounts.signatureNft(count=${cscNftCount})`),
    ).toBeInTheDocument();
  });

  it('renders with null data without crashing', () => {
    render(<Prize data={null} />);
    expect(screen.getByText('home.allocation.title')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Prize data={mockData} />);
    await checkA11y(container);
  });
});
