import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

jest.mock('viem', () => ({
  ...jest.requireActual('../../../__mocks__/viem'),
  zeroAddress: '0x0000000000000000000000000000000000000000',
}));

jest.mock('../../../utils', () => ({
  formatSeconds: jest.fn((s: number) => `${s}s`),
}));

jest.mock('../../nft/PaginationRWLKGrid', () => ({
  __esModule: true,
  default: ({ data }: { data: number[] }) => <div data-testid="rwlk-grid">{data.length} NFTs</div>,
}));

import { isV3Mechanics } from '@/content/protocol-facts';

import type { DashboardInfo } from '@/services/api/types';
import { CST_UNISWAP_SWAP_URL } from '@/config/uniswap';

import { render, screen, fireEvent, checkA11y } from '@/test-utils';

import { GestureForm } from '../GestureForm';

const defaultProps = {
  data: { LastBidderAddr: '0xSomeAddr' } as Partial<DashboardInfo> as DashboardInfo,
  gestureType: 'ETH',
  setBidType: jest.fn(),
  contributionType: 'NFT',
  setContributionType: jest.fn(),
  message: '',
  setMessage: jest.fn(),
  nftDonateAddress: '',
  setNftDonateAddress: jest.fn(),
  nftId: '',
  setNftId: jest.fn(),
  tokenDonateAddress: '',
  setTokenDonateAddress: jest.fn(),
  tokenAmount: '',
  setTokenAmount: jest.fn(),
  rwlkId: -1,
  setRwlkId: jest.fn(),
  gestureCostPlus: 2,
  setBidPricePlus: jest.fn(),
  advancedExpanded: false,
  setAdvancedExpanded: jest.fn(),
  rwlknftIds: [1, 3, 5],
  cstGestureData: {
    AuctionDuration: 3600,
    CSTPrice: 1.5,
    CSTPriceWei: 1500000000000000000n,
    SecondsElapsed: 1800,
    isFree: false,
    source: 'api' as const,
  },
  ethGestureInfo: { AuctionDuration: 3600, ETHPrice: 0.01, SecondsElapsed: 1800 },
  gestureCstRewardAmount: 100,
  gestureCstRewardAmountMin: 99,
  isCstRewardLoading: false,
  cstRewardTolerancePercent: 1,
  setCstRewardTolerancePercent: jest.fn(),
  acceptAnyCstReward: false,
  setAcceptAnyCstReward: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GestureForm', () => {
  it('renders gesture type selector with ETH option', () => {
    render(<GestureForm {...defaultProps} />);
    expect(screen.getByText('home.form.method.eth.label')).toBeInTheDocument();
    expect(screen.getByText('home.form.methodLabel')).toBeInTheDocument();
  });

  it('hides RandomWalk/CST when LastBidderAddr is zeroAddress', () => {
    render(
      <GestureForm
        {...defaultProps}
        data={
          {
            LastBidderAddr: '0x0000000000000000000000000000000000000000',
          } as Partial<DashboardInfo> as DashboardInfo
        }
      />,
    );
    expect(screen.getByText('home.form.method.eth.label')).toBeInTheDocument();
    expect(screen.queryByText('home.form.method.randomWalk.label')).not.toBeInTheDocument();
    expect(screen.queryByText('home.form.method.cst.desc')).not.toBeInTheDocument();
  });

  it('shows RandomWalk/CST when LastBidderAddr is not zero', () => {
    render(<GestureForm {...defaultProps} />);
    expect(screen.getByText('home.form.method.randomWalk.label')).toBeInTheDocument();
    expect(screen.getByText('home.form.method.cst.desc')).toBeInTheDocument();
  });

  it('ETH selection renders correctly', () => {
    render(<GestureForm {...defaultProps} gestureType="ETH" />);
    expect(screen.getByText('home.form.method.eth.label')).toBeInTheDocument();
    expect(screen.queryByTestId('rwlk-grid')).not.toBeInTheDocument();
    expect(screen.getByText('home.form.reward.previewTitle')).toBeInTheDocument();
    expect(screen.queryByText(/Protection 1:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Protection 2:/)).not.toBeInTheDocument();
  });

  it('RandomWalk selection shows NFT gallery', () => {
    render(<GestureForm {...defaultProps} gestureType="RandomWalk" />);
    expect(screen.getByText('home.form.rwlk.title')).toBeInTheDocument();
    expect(screen.getByTestId('rwlk-grid')).toHaveTextContent('3 NFTs');
    expect(screen.getByText('home.form.reward.previewTitle')).toBeInTheDocument();
    expect(screen.queryByText(/Protection 1:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Protection 2:/)).not.toBeInTheDocument();
  });

  it('CST selection shows Calibration Window info', () => {
    render(<GestureForm {...defaultProps} gestureType="CST" />);
    expect(screen.getByRole('region', { name: 'home.calibration.cstTitle' })).toBeInTheDocument();
    expect(screen.getByText('home.calibration.dynamicDuration')).toBeInTheDocument();
    expect(screen.getByText('home.calibration.percentComplete(percent=50%)')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', {
        name: 'home.calibration.progressAria(title=home.calibration.cstTitle)',
      }),
    ).toHaveAttribute('aria-valuenow', '50');
  });

  it('CST selection links to trade CST on Uniswap', () => {
    render(<GestureForm {...defaultProps} gestureType="CST" />);

    expect(screen.getByRole('link', { name: 'nav.ecosystem.uniswap.ariaLabel' })).toHaveAttribute(
      'href',
      CST_UNISWAP_SWAP_URL,
    );
  });

  it('does not show the Uniswap trade link for ETH selection', () => {
    render(<GestureForm {...defaultProps} gestureType="ETH" />);

    expect(
      screen.queryByRole('link', { name: 'nav.ecosystem.uniswap.ariaLabel' }),
    ).not.toBeInTheDocument();
  });

  it('shows first-gesture ETH Calibration Window copy before all methods unlock', () => {
    render(
      <GestureForm
        {...defaultProps}
        data={
          {
            LastBidderAddr: '0x0000000000000000000000000000000000000000',
          } as Partial<DashboardInfo> as DashboardInfo
        }
        gestureType="ETH"
      />,
    );

    expect(
      screen.getByRole('region', { name: 'home.calibration.firstGestureTitle' }),
    ).toBeInTheDocument();
    expect(screen.getByText('home.calibration.firstGestureSubtitle')).toBeInTheDocument();
  });

  it('CST selection shows reward preview and minimum accepted amount', () => {
    render(<GestureForm {...defaultProps} gestureType="CST" />);
    expect(screen.getByText('home.form.reward.economicsTitle')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.cstAmount(amount=100)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.cstAmount(amount=1.5)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.cstAmount(amount=+98.5)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.netPositive')).toBeInTheDocument();
    expect(
      screen.getByText('home.form.reward.minAccepted(value=home.form.reward.cstAmount(amount=99))'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Protection 1:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Protection 2:/)).not.toBeInTheDocument();
  });

  it('explains the minimum accepted CST reward guard', async () => {
    const user = userEvent.setup();
    render(<GestureForm {...defaultProps} gestureType="CST" />);

    await user.hover(screen.getByRole('button', { name: 'home.form.reward.minAcceptedAria' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'home.form.reward.minAcceptedTooltip',
    );
  });

  it('shows negative net CST when the CST gesture cost is greater than the reward', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        gestureCstRewardAmount={1}
        gestureCstRewardAmountMin={0.99}
        cstGestureData={{
          ...defaultProps.cstGestureData,
          CSTPrice: 1.5,
          CSTPriceWei: 1500000000000000000n,
          isFree: false,
        }}
      />,
    );

    expect(screen.getByText('home.form.reward.cstAmount(amount=-0.5)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.netNegative')).toBeInTheDocument();
  });

  it('shows positive net CST when the CST reward is greater than the cost', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        gestureCstRewardAmount={5}
        gestureCstRewardAmountMin={4.95}
        cstGestureData={{
          ...defaultProps.cstGestureData,
          CSTPrice: 1.25,
          CSTPriceWei: 1250000000000000000n,
          isFree: false,
        }}
      />,
    );

    expect(screen.getByText('home.form.reward.cstAmount(amount=+3.75)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.netPositive')).toBeInTheDocument();
  });

  it('treats free CST gestures as zero cost when calculating net CST', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        gestureCstRewardAmount={2}
        gestureCstRewardAmountMin={1.98}
        cstGestureData={{
          ...defaultProps.cstGestureData,
          CSTPrice: 1.5,
          CSTPriceWei: 1500000000000000000n,
          isFree: true,
        }}
      />,
    );

    expect(screen.getByText('home.form.reward.cstAmount(amount=0)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.cstAmount(amount=+2)')).toBeInTheDocument();
  });

  it('shows a loading state while the live CST reward preview is refreshing', () => {
    render(<GestureForm {...defaultProps} gestureType="CST" isCstRewardLoading />);
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
    expect(
      screen.getByText('home.form.reward.minAccepted(value=home.form.reward.cstAmount(amount=99))'),
    ).toBeInTheDocument();
    expect(screen.queryByText('home.form.reward.netPositive')).not.toBeInTheDocument();
  });

  it('shows a placeholder when the live CST reward preview is unavailable', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        gestureCstRewardAmount={null}
        gestureCstRewardAmountMin={null}
      />,
    );

    expect(screen.getAllByText('home.form.reward.cstAmount(amount=--)')).toHaveLength(2);
    expect(
      screen.getByText('home.form.reward.minAccepted(value=home.form.reward.cstAmount(amount=--))'),
    ).toBeInTheDocument();
    expect(screen.queryByText('home.form.reward.netPositive')).not.toBeInTheDocument();
    expect(screen.queryByText('home.form.reward.netNegative')).not.toBeInTheDocument();
  });

  it('updates displayed CST reward preview values when live props change', () => {
    const { rerender } = render(<GestureForm {...defaultProps} gestureType="CST" />);

    expect(screen.getByText('home.form.reward.cstAmount(amount=100)')).toBeInTheDocument();
    expect(
      screen.getByText('home.form.reward.minAccepted(value=home.form.reward.cstAmount(amount=99))'),
    ).toBeInTheDocument();

    rerender(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        gestureCstRewardAmount={125}
        gestureCstRewardAmountMin={123.75}
      />,
    );

    expect(screen.getByText('home.form.reward.cstAmount(amount=125)')).toBeInTheDocument();
    expect(screen.getByText('home.form.reward.cstAmount(amount=+123.5)')).toBeInTheDocument();
    expect(
      screen.getByText(
        'home.form.reward.minAccepted(value=home.form.reward.cstAmount(amount=123.75))',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('home.form.reward.cstAmount(amount=100)')).not.toBeInTheDocument();
  });

  it('hides gesture protections before the first gesture unlocks all methods', () => {
    render(
      <GestureForm
        {...defaultProps}
        data={
          {
            LastBidderAddr: '0x0000000000000000000000000000000000000000',
          } as Partial<DashboardInfo> as DashboardInfo
        }
      />,
    );
    expect(screen.queryByText('home.form.reward.previewTitle')).not.toBeInTheDocument();
  });

  it('CST preview shows zero minimum when accepting any reward', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        acceptAnyCstReward
        gestureCstRewardAmountMin={0}
      />,
    );
    expect(
      screen.getByText('home.form.reward.minAccepted(value=home.form.reward.minAcceptedAny)'),
    ).toBeInTheDocument();
  });

  it('Message textarea accepts input', () => {
    render(<GestureForm {...defaultProps} advancedExpanded />);
    const textarea = screen.getByPlaceholderText('home.form.advanced.messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'hello world' } });
    expect(defaultProps.setMessage).toHaveBeenCalledWith('hello world');
  });

  it('shows a live character counter for the message', () => {
    const { rerender } = render(<GestureForm {...defaultProps} advancedExpanded />);
    expect(screen.getByTestId('gesture-message-char-count')).toHaveTextContent('0/280');

    rerender(<GestureForm {...defaultProps} advancedExpanded message="hello" />);
    expect(screen.getByTestId('gesture-message-char-count')).toHaveTextContent('5/280');
  });

  it('highlights the character counter when the message nears the limit', () => {
    const { rerender } = render(
      <GestureForm {...defaultProps} advancedExpanded message={'a'.repeat(259)} />,
    );
    expect(screen.getByTestId('gesture-message-char-count')).not.toHaveClass('text-amber-300');

    rerender(<GestureForm {...defaultProps} advancedExpanded message={'a'.repeat(260)} />);
    expect(screen.getByTestId('gesture-message-char-count')).toHaveClass('text-amber-300');
  });

  it('explains that gesture messages appear in chat and stay on-chain', async () => {
    const user = userEvent.setup();
    render(<GestureForm {...defaultProps} advancedExpanded />);

    await user.hover(screen.getByRole('button', { name: 'home.form.advanced.messageTooltipAria' }));

    expect(await screen.findAllByText('home.form.advanced.messageTooltip')).not.toHaveLength(0);
  });

  it('Advanced options accordion toggles', () => {
    const { rerender } = render(<GestureForm {...defaultProps} advancedExpanded={false} />);
    expect(screen.getByText('home.form.advanced.title')).toBeInTheDocument();
    expect(screen.queryByText('home.form.advanced.messageLabel')).not.toBeInTheDocument();
    expect(screen.queryByText('home.form.advanced.attachIntro')).not.toBeInTheDocument();

    rerender(<GestureForm {...defaultProps} advancedExpanded={true} />);
    expect(screen.getByText('home.form.advanced.messageLabel')).toBeInTheDocument();
    expect(screen.getByText('home.form.advanced.attachIntro')).toBeInTheDocument();
  });

  it('NFT contribution form renders with advancedExpanded=true, contributionType=NFT', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="NFT" />);
    expect(screen.getByText('home.form.advanced.nftContractLabel')).toBeInTheDocument();
    expect(screen.getByText('home.form.advanced.nftIdLabel')).toBeInTheDocument();
  });

  it('Token contribution form renders with advancedExpanded=true, contributionType=Token', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="Token" />);
    expect(screen.getByText('home.form.advanced.tokenContractLabel')).toBeInTheDocument();
    expect(screen.getByText('home.form.advanced.tokenAmountLabel')).toBeInTheDocument();
  });

  it('gesture cost collision prevention section shows for non-CST gesture types', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="ETH" />);
    expect(screen.getByText('home.form.advanced.collision.title')).toBeInTheDocument();
  });

  it('clicking RandomWalk radio calls setBidType and resets rwlkId', async () => {
    const user = userEvent.setup();
    render(<GestureForm {...defaultProps} gestureType="ETH" />);

    await user.click(screen.getByText('home.form.method.randomWalk.label'));

    expect(defaultProps.setRwlkId).toHaveBeenCalledWith(-1);
    expect(defaultProps.setBidType).toHaveBeenCalledWith('RandomWalk');
  });

  it('clicking CST radio calls setBidType and resets rwlkId', async () => {
    const user = userEvent.setup();
    render(<GestureForm {...defaultProps} gestureType="ETH" />);

    await user.click(screen.getByText('home.form.method.cst.label'));

    expect(defaultProps.setRwlkId).toHaveBeenCalledWith(-1);
    expect(defaultProps.setBidType).toHaveBeenCalledWith('CST');
  });

  it('switching contribution type calls setContributionType and resets rwlkId', async () => {
    const user = userEvent.setup();
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="NFT" />);

    await user.click(screen.getByText('home.form.advanced.attachToken'));

    expect(defaultProps.setRwlkId).toHaveBeenCalledWith(-1);
    expect(defaultProps.setContributionType).toHaveBeenCalledWith('Token');
  });

  it('NFT contribution address input calls setNftDonateAddress', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="NFT" />);
    const inputs = screen.getAllByPlaceholderText('0x...');
    fireEvent.change(inputs[0]!, { target: { value: '0xNFTContract' } });
    expect(defaultProps.setNftDonateAddress).toHaveBeenCalledWith('0xNFTContract');
  });

  it('NFT number input calls setNftId', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="NFT" />);
    const input = screen.getByPlaceholderText('home.form.advanced.nftIdPlaceholder');
    fireEvent.change(input, { target: { value: '42' } });
    expect(defaultProps.setNftId).toHaveBeenCalledWith('42');
  });

  it('Token Contract Address input calls setTokenDonateAddress', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="Token" />);
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0xTokenAddr' } });
    expect(defaultProps.setTokenDonateAddress).toHaveBeenCalledWith('0xTokenAddr');
  });

  it('Token Amount input calls setTokenAmount', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} contributionType="Token" />);
    const input = screen.getByPlaceholderText('0.0');
    fireEvent.change(input, { target: { value: '100' } });
    expect(defaultProps.setTokenAmount).toHaveBeenCalledWith('100');
  });

  it('gesture cost plus input calls setBidPricePlus for values <= 50', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="ETH" />);
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '10' } });
    expect(defaultProps.setBidPricePlus).toHaveBeenCalledWith(10);
  });

  it('gesture cost plus input rejects values > 50', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="ETH" />);
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '51' } });
    expect(defaultProps.setBidPricePlus).not.toHaveBeenCalled();
  });

  it('computed gesture cost shows ETH amount with gestureCostPlus applied', () => {
    render(
      <GestureForm
        {...defaultProps}
        advancedExpanded={true}
        gestureType="ETH"
        gestureCostPlus={10}
      />,
    );
    const expectedPrice = (0.01 * (1 + 10 / 100) * 1).toFixed(6);
    expect(
      screen.getByText(`home.form.advanced.collision.approxCost(amount=${expectedPrice})`),
    ).toBeInTheDocument();
  });

  it('computed gesture cost applies 50% discount for ETH + RandomWalk', () => {
    render(
      <GestureForm
        {...defaultProps}
        advancedExpanded={true}
        gestureType="RandomWalk"
        gestureCostPlus={0}
      />,
    );
    const expectedPrice = (0.01 * 1 * 0.5).toFixed(6);
    expect(
      screen.getByText(`home.form.advanced.collision.approxCost(amount=${expectedPrice})`),
    ).toBeInTheDocument();
  });

  it('hides gesture cost collision prevention for CST gesture type', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="CST" />);
    expect(screen.queryByText('home.form.advanced.collision.title')).not.toBeInTheDocument();
  });

  it('shows minimum CST reward protection control for every unlocked gesture type', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="ETH" />);
    expect(screen.getByText('home.form.advanced.minCstProtection.title')).toBeInTheDocument();
    expect(
      screen.getByText(
        isV3Mechanics
          ? 'home.form.advanced.minCstProtection.bodyV3'
          : 'home.form.advanced.minCstProtection.body',
      ),
    ).toBeInTheDocument();
  });

  it('updates CST reward tolerance from advanced options', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="CST" />);
    const input = screen.getByPlaceholderText('1');
    fireEvent.change(input, { target: { value: '5' } });
    expect(defaultProps.setCstRewardTolerancePercent).toHaveBeenCalledWith(5);
  });

  it('allows users to accept any CST reward including zero', () => {
    render(<GestureForm {...defaultProps} advancedExpanded={true} gestureType="CST" />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'home.form.advanced.minCstProtection.acceptAnyAria',
    });

    fireEvent.click(checkbox);

    expect(defaultProps.setAcceptAnyCstReward).toHaveBeenCalledWith(true);
    expect(
      screen.getByText('home.form.advanced.minCstProtection.acceptAnyBody'),
    ).toBeInTheDocument();
  });

  it('disables CST tolerance input when accepting any CST reward', () => {
    render(
      <GestureForm
        {...defaultProps}
        advancedExpanded={true}
        gestureType="CST"
        acceptAnyCstReward
      />,
    );

    expect(screen.getByPlaceholderText('1')).toBeDisabled();
  });

  it('shows CalibrationInfo with endedMessage for CST when window closed', () => {
    render(
      <GestureForm
        {...defaultProps}
        gestureType="CST"
        cstGestureData={{
          ...defaultProps.cstGestureData,
          AuctionDuration: 43200,
          SecondsElapsed: 50000,
          source: 'contract',
          apiAuctionDuration: 3600,
        }}
      />,
    );
    expect(screen.getByText('home.calibration.cstEndedMessage')).toBeInTheDocument();
    expect(
      screen.getByText(
        'home.form.reward.durationMismatch(contractDuration=43200s,apiDuration=3600s)',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('progressbar', {
        name: 'home.calibration.progressAria(title=home.calibration.cstTitle)',
      }),
    ).not.toBeInTheDocument();
  });

  it('marks the selected gesture method with aria-pressed', () => {
    render(<GestureForm {...defaultProps} gestureType="ETH" />);

    expect(
      screen.getByRole('button', {
        name: 'home.form.method.eth.label home.form.method.eth.desc',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', {
        name: 'home.form.method.randomWalk.label home.form.method.randomWalk.desc',
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('labels the RandomWalk discount tooltip trigger', () => {
    render(<GestureForm {...defaultProps} gestureType="RandomWalk" />);

    expect(screen.getByRole('button', { name: 'home.form.rwlk.tooltipAria' })).toBeInTheDocument();
  });

  describe('preview mode (disconnected wallet)', () => {
    it('shows the connect explainer banner', () => {
      render(<GestureForm {...defaultProps} previewMode />);

      expect(screen.getByText('home.form.preview')).toBeInTheDocument();
    });

    it('keeps the gesture method picker interactive for exploration', async () => {
      const user = userEvent.setup();
      render(<GestureForm {...defaultProps} previewMode gestureType="ETH" />);

      await user.click(screen.getByText('home.form.method.randomWalk.label'));

      expect(defaultProps.setBidType).toHaveBeenCalledWith('RandomWalk');
    });

    it('disables the message textarea', () => {
      render(<GestureForm {...defaultProps} previewMode advancedExpanded />);

      expect(screen.getByPlaceholderText('home.form.advanced.messagePlaceholder')).toBeDisabled();
    });

    it('disables the advanced options accordion trigger', () => {
      render(<GestureForm {...defaultProps} previewMode />);

      expect(screen.getByRole('button', { name: /home\.form\.advanced\.title/ })).toBeDisabled();
    });

    it('disables attachment inputs when advanced options are expanded', () => {
      render(<GestureForm {...defaultProps} previewMode advancedExpanded contributionType="NFT" />);

      expect(screen.getByPlaceholderText('0x...')).toBeDisabled();
      expect(screen.getByPlaceholderText('home.form.advanced.nftIdPlaceholder')).toBeDisabled();
    });

    it('does not show the preview banner for connected users', () => {
      render(<GestureForm {...defaultProps} advancedExpanded />);

      expect(screen.queryByText('home.form.preview')).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('home.form.advanced.messagePlaceholder'),
      ).not.toBeDisabled();
    });

    it('has no accessibility violations in preview mode', async () => {
      const { container } = render(<GestureForm {...defaultProps} previewMode />);
      await checkA11y(container);
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<GestureForm {...defaultProps} />);
    await checkA11y(container);
  });
});
