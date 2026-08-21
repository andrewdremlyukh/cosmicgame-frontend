import {
  cstRewardFacts,
  ethDistributionFacts,
  isV3Mechanics,
  nftAllocationFacts,
  protocolFacts,
} from '@/content/protocol-facts';

import { HOW_IT_WORKS_PATH, type HowItWorksContent } from './types';

export const howItWorksContentEn = {
  metadata: {
    title: 'How Cosmic Signature Works | Performance Cycles, Gestures, and NFTs',
    description:
      'Learn how a Cosmic Signature Performance Cycle unfolds — from the Calibration Window through Gestures to final allocation distribution.',
    path: HOW_IT_WORKS_PATH,
  },
  jsonLd: {
    name: 'How Cosmic Signature Works',
    description:
      'Learn how a Cosmic Signature Performance Cycle unfolds — from the Calibration Window through Gestures to final allocation distribution.',
  },
  breadcrumbs: {
    homeLabel: 'Home',
    pageLabel: 'How It Works',
  },
  hero: {
    badge: 'Procedural On-Chain Art Protocol',
    headingLead: 'How Cosmic Signature',
    headingAccent: 'Works',
    paragraph:
      'Gesture. Endure. Shape the Signature. Participants make gestures during a Performance Cycle. When the Cycle Finalization Time expires, the cycle can be finalized and allocations distribute across more than ten tracks — including the Signature Allocation, Anchor Distributions, and Protocol Guild.',
    primaryCta: { label: 'Open the Protocol', href: '/' },
    secondaryCta: { label: 'Learn More', href: '#protocol-overview' },
  },
  overview: {
    heading: 'How It Works',
    subhead: 'Three steps to participate and shape the Cycle Reserve',
    cards: [
      {
        number: '01',
        title: 'Gesture',
        description:
          'Make a gesture with ETH or CST (ERC-20). Each gesture extends the Cycle Finalization Time, records a Stellar Selection entry, and shapes the evolving Signature.',
        tooltip: `Gestures can be made with ETH or CST tokens (ERC-20). Attaching a Random Walk NFT to an ETH gesture grants a one-time ${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction.`,
      },
      {
        number: '02',
        title: 'Endure',
        description:
          'The cycle runs until the Cycle Finalization Time expires. Each new gesture adds the current time increment to the stored finalization time.',
        tooltip:
          'The time increment starts around one hour and grows gradually across cycles. CST Gesture Cost uses a dynamic Calibration Window that ETH and CST gestures move in opposite directions.',
      },
      {
        number: '03',
        title: 'Receive',
        description:
          'Participate in allocations when the cycle finalizes — Signature Allocation, Stellar Selections, Anchor Distributions, and more.',
        tooltip: `The participant who made the Final Gesture receives ${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve, ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST, and ${nftAllocationFacts.mainPrizeNftPhrase.en}. Stellar Selection recipients, anchor-holders, and other participants also receive allocations.`,
      },
    ],
  },
  rewardBreakdown: {
    heading: 'What Every Gesture Imprints',
    subhead: 'Participation imprints multiple allocation tracks per cycle.',
    items: [
      {
        title: 'Dynamic Participation CST',
        description:
          'Each gesture may imprint CST based on how long it has been since the previous gesture.',
        tooltip: `Participation CST uses a ${isV3Mechanics ? 'linear' : 'square-root'} formula: ${cstRewardFacts.formula}. Rapid gestures can receive 0 CST; longer quiet periods create larger imprints.`,
      },
      {
        title: 'Stellar Selection Entry',
        description:
          'Each gesture records an entry in Stellar Selection for end-of-cycle allocations.',
        tooltip: `When the cycle finalizes, entries are randomly selected: three participants share ${ethDistributionFacts.stellarSelectionEthPercentage}% of the Cycle Reserve in ETH.`,
      },
      {
        title: 'Cosmic Signature NFT Selection',
        description: `Ten participants receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and a unique Cosmic Signature NFT via Stellar Selection each cycle.`,
        tooltip: `Ten Stellar Selection recipients plus ten Random Walk NFT anchor-holders each receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and a Cosmic Signature NFT each cycle.`,
      },
      {
        title: 'Signature Allocation',
        description: `The participant who made the Final Gesture may retrieve ${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve in ETH, ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST, and ${nftAllocationFacts.mainPrizeNftPhrase.en}.`,
        tooltip:
          'The Cycle Reserve grows from all gestures. The participant who made the Final Gesture retrieves the Signature Allocation via the protocol contract.',
      },
    ],
  },
  gameCycle: {
    heading: 'Lifecycle of a Performance Cycle',
    subhead: 'Every cycle follows this sequence from open to finalization.',
    phases: [
      {
        label: 'Cycle Opens',
        description: `A new Performance Cycle begins. The first ETH Calibration Window opens, and the CST Calibration Window starts from a ${protocolFacts.initialCstCalibrationWindowHours}-hour reference that then changes with participation.`,
        tooltip:
          'Calibration Windows let participants gesture at falling cost. The Cycle Reserve starts at zero plus the Compounding Reserve from the previous cycle.',
      },
      {
        label: 'Participants Gesture',
        description: isV3Mechanics
          ? 'Each gesture adds the current time increment to Cycle Finalization Time. Participation CST is dynamic, and each CST gesture restarts the CST Calibration Window at twice the price it paid; the cost then declines at a steady rate.'
          : `Each gesture adds the current time increment to Cycle Finalization Time. Participation CST is dynamic, and ETH/CST gestures move the CST Calibration Window by about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}% down or ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}% up.`,
        tooltip: isV3Mechanics
          ? 'Participation CST accrues linearly with elapsed time since the previous gesture. The current app preview is the source of truth for the exact CST amount.'
          : 'Participation CST follows a square-root formula based on elapsed time since the previous gesture. The current app preview is the source of truth for the exact CST amount.',
      },
      {
        label: 'Cycle Finalization Time Expires',
        description:
          'When the countdown reaches zero, the participant who made the Final Gesture becomes eligible to finalize the cycle.',
        tooltip: `Gestures remain possible until finalization actually executes — a late gesture extends the stored time and takes over the Final Gesture position. The Final Gesture participant has a ${protocolFacts.finalGestureExclusivityHours}-hour exclusive finalization window; afterwards anyone may finalize and receives the Signature Allocation.`,
      },
      {
        label: 'Cycle Finalizes',
        description: `The participant who made the Final Gesture retrieves the Signature Allocation: ${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve, ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST, and ${nftAllocationFacts.mainPrizeNftPhrase.en}.`,
        tooltip:
          'The Signature Allocation retrieval happens via the protocol contract. The CST and Cosmic Signature NFT allocations are imprinted automatically.',
      },
      {
        label: 'Stellar Selections',
        description: `Three ETH Stellar Selection recipients share ${ethDistributionFacts.stellarSelectionEthPercentage}% of the Cycle Reserve. Ten NFT Stellar Selection recipients plus ten Anchored-NFT Stellar Selection recipients each receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and a Cosmic Signature NFT.`,
        tooltip:
          'Entries are recorded per gesture. More gestures means higher Selection frequency. Random Walk NFT anchor-holders have a separate Stellar Selection.',
      },
      {
        label: 'Next Cycle',
        description:
          'About half of the Cycle Reserve rolls forward as the Compounding Reserve, and the next cycle begins with fresh Calibration Windows.',
        tooltip:
          'The Compounding Cycle Reserve means the protocol accumulates value rather than extracts it. The live contracts report the current window durations and costs.',
      },
    ],
  },
  stepByStep: {
    heading: 'Getting Started',
    subhead: 'From wallet connection to your first gesture in three steps.',
    stepLabel: 'STEP',
    steps: [
      {
        title: 'Connect Your Wallet',
        tooltip:
          'Arbitrum is a Layer 2 blockchain on Ethereum with lower gas fees and faster transactions.',
        highlights: [
          'Click the "Connect Wallet" button at the top of the page.',
          'Use a wallet that supports the Arbitrum blockchain, such as MetaMask.',
          'Switch your network to Arbitrum when prompted, then approve permissions.',
          'Your wallet address will appear in the header once connected.',
        ],
      },
      {
        title: 'Check the Gesture Cost',
        tooltip:
          'Gas fees on Arbitrum are typically a few cents — much cheaper than Ethereum mainnet.',
        highlights: [
          'Review the Cycle Finalization Time — every gesture adds the current time increment to the stored finalization time.',
          'Check the current Gesture Cost in ETH or CST before committing.',
          'Review the live Participation CST preview; the amount changes with time since the previous gesture.',
          'Note the Signature Allocation amount to see the potential ETH distribution.',
          'Ensure your wallet holds the Gesture Cost plus a small amount for gas fees.',
        ],
      },
      {
        title: 'Make Your Gesture',
        tooltip: `Each Random Walk NFT can be used once for the ${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction - choose your moment wisely.`,
        highlights: [
          `Choose ETH, optionally attach a Random Walk NFT for a ${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction, or make a CST (ERC-20) gesture.`,
          'Click "Gesture Now" and confirm the transaction in your wallet.',
          'Your gesture extends the Cycle Finalization Time and updates the ETH/CST cost state.',
          'Every gesture records a Stellar Selection entry and may imprint dynamic Participation CST automatically.',
        ],
      },
    ],
  },
  proTips: {
    heading: 'Pro Tips & Strategy',
    subhead: 'Practical guidance for maximizing participation across allocation tracks.',
    tips: [
      {
        title: 'Watch Both Calibration Windows',
        description:
          'ETH and CST Gesture Costs follow separate live windows, and each gesture changes the CST window.',
        tooltip:
          'ETH gestures slightly shorten the CST Calibration Window; CST gestures slightly lengthen it. The live app panels show the current cost path.',
      },
      {
        title: 'Attach a Random Walk NFT',
        description: `Holding a Random Walk NFT grants a one-time ${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction.`,
        tooltip:
          'Each Random Walk NFT can be used once for the cost reduction. Save it for a higher-cost gesture to maximize the effect.',
      },
      {
        title: 'Stack Stellar Selection Entries',
        description:
          'Each gesture records one Stellar Selection entry. More gestures means higher Selection frequency.',
        tooltip: `Three ETH Stellar Selection recipients share ${ethDistributionFacts.stellarSelectionEthPercentage}% of the Cycle Reserve. Ten participant NFT recipients and ten Random Walk NFT anchor-holders each receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and a Cosmic Signature NFT.`,
      },
      {
        title: 'Use a Burner Wallet',
        description:
          'The smart contracts are publicly source-verified on-chain, but using a dedicated wallet for participation adds an extra layer of safety.',
        tooltip:
          'A burner wallet isolates your protocol activity from your main holdings for additional security. Audit and verification status is published on the Audits page.',
      },
      {
        title: 'Watch the Finalization Time',
        description:
          'Each gesture adds the current time increment to the stored Cycle Finalization Time.',
        tooltip:
          'Gesturing near the deadline positions you closest to the Final Gesture, but another participant can still gesture after you until the cycle is finalized.',
      },
      {
        title: 'Gesture with CST',
        description:
          'Use CST as an alternative gesture currency through the CST Calibration Window.',
        tooltip: isV3Mechanics
          ? 'A CST gesture records a Stellar Selection entry, extends the timer, may imprint dynamic Participation CST, and restarts the CST Calibration Window at twice the price it paid.'
          : `A CST gesture records a Stellar Selection entry, extends the timer, may imprint dynamic Participation CST, and lengthens the CST Calibration Window by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%.`,
      },
    ],
  },
  faqCallout: {
    heading: 'Have Questions?',
    body: 'Read the FAQ for detailed answers on cycle mechanics, allocation tracks, tokens, and everything else about Cosmic Signature.',
    cta: { label: 'Browse FAQ', href: '/faq' },
  },
  callToAction: {
    heading: 'Ready to Make Your First Gesture?',
    // The JSX original rendered a literal "\u2019" because unicode escapes are
    // not processed inside JSX text; this is the intentional fix to a real ’.
    body: 'Join the active Performance Cycle. Connect your wallet and make your first gesture to start imprinting CST and shaping the cycle’s Signature.',
    primaryCta: { label: 'Open the Protocol', href: '/' },
    discordCta: {
      label: 'Discord',
      href: 'https://discord.com/channels/1258032742084509779/1258691600951935056',
    },
    twitterCta: { label: 'Twitter / X', href: 'https://x.com/CosmicSignature' },
  },
} as const satisfies HowItWorksContent;
