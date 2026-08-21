import {
  ethDistributionFacts,
  isV3Mechanics,
  nftAllocationFacts,
  protocolFacts,
} from '@/content/protocol-facts';

import { CST_GECKOTERMINAL_POOL_URL } from '@/config/geckoterminal';
import { COSMIC_SIGNATURE_MARKETPLACE_URL } from '@/config/marketplace';
import { CHAOS_ZERO_PREDICTIONS_URL } from '@/config/predictions';
import { CST_UNISWAP_SWAP_URL } from '@/config/uniswap';
import { APP_ORIGIN } from '@/lib/hostRouting';

import type { LandingContent } from './types';

export const landingContentEn = {
  meta: {
    title: 'Cosmic Signature: Procedural On-Chain Art Protocol on Arbitrum',
    description:
      'Cosmic Signature is a procedural on-chain art protocol on Arbitrum. Every gesture shapes the cycle’s final Signature, and the protocol redistributes its reserves across everyone who shaped the outcome — including the infrastructure Ethereum itself depends on.',
    keywords: [
      'Cosmic Signature',
      'procedural art protocol',
      'on-chain art',
      'Arbitrum',
      'three-body problem',
      'generative art',
      'public goods',
      'Protocol Guild',
      'CC0',
      'formally verified',
    ],
  },

  hero: {
    eyebrow: 'Procedural on-chain art protocol · Arbitrum',
    headline: 'Cosmic Signature: Procedural On-Chain Art on Arbitrum',
    headlineLead: 'Cosmic Signature: Procedural On-Chain Art on',
    headlineAccent: 'Arbitrum',
    subhead:
      'Every Gesture Shapes the Signature. Make a gesture during a Performance Cycle, and every gesture shapes the cycle’s final Signature. When the cycle finalizes, the protocol distributes its reserves across more than ten allocation tracks — including the infrastructure Ethereum itself depends on.',
    biologyDisclaimer:
      'Cosmic Signature is not related to the COSMIC cancer mutation database or COSMIC mutational signatures in biology. It is an on-chain art protocol and app.',
    primaryCta: { label: 'Open the App', href: APP_ORIGIN },
    secondaryCta: { label: 'Explore the Cycle', href: '#cycle' },
    statisticsCta: { label: 'Protocol statistics', href: `${APP_ORIGIN}/statistics` },
    galleryCta: { label: 'NFT gallery', href: `${APP_ORIGIN}/gallery` },
    scrollAriaLabel: 'Scroll to The Cycle section',
    marqueeChips: [
      'Verified Contracts',
      'CC0',
      'Open Source',
      'Deterministic Art',
      '7% to Protocol Guild',
      'Cosmic Council',
      'Arbitrum One',
    ],
  },

  cycle: {
    eyebrow: 'The Cycle',
    heading: 'A Performance Cycle, from open to finalization.',
    description:
      'A cycle is a window in time. It opens with a Calibration Window, fills with gestures, and finalizes when the Cycle Finalization Time expires. No houses. No dealers. Just the protocol.',
    stages: [
      {
        number: '01',
        title: 'Cycle Opening',
        body: `A new Performance Cycle begins. The first ETH Calibration Window opens, and the CST Calibration Window uses a stored on-chain duration that currently starts from a ${protocolFacts.initialCstCalibrationWindowHours}-hour reference.`,
      },
      {
        number: '02',
        title: 'Gestures',
        body: isV3Mechanics
          ? 'Participants make gestures with ETH or CST. Every gesture extends the Cycle Finalization Time, records a Stellar Selection entry, and may imprint dynamic Participation CST that accrues at a steady rate with the time since the previous gesture. Each CST gesture restarts the CST Calibration Window at twice the price it paid; the price then declines at the same steady rate.'
          : `Participants make gestures with ETH or CST. Every gesture extends the Cycle Finalization Time, records a Stellar Selection entry, and may imprint dynamic Participation CST based on the square root of the time since the previous gesture. ETH gestures shorten the CST Calibration Window by about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%; CST gestures lengthen it by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%.`,
      },
      {
        number: '03',
        title: 'Finalization',
        body: 'When the Cycle Finalization Time expires, the participant who made the Final Gesture may finalize the cycle. After the exclusivity window, the Open-Finalization Window opens to anyone.',
      },
      {
        number: '04',
        title: 'Allocations',
        body: 'The protocol distributes the Cycle Reserve across more than ten allocation tracks. About half of the ETH reserve rolls into the next cycle’s Compounding Reserve.',
      },
    ],
  },

  art: {
    eyebrow: 'The Art',
    heading: 'The Three Body Problem, rendered on-chain.',
    description:
      'Every Cosmic Signature NFT visualizes three celestial bodies orbiting under Newtonian gravity. Three bodies produce fundamentally chaotic trajectories. No AI. No training data. Just deterministic physics. Same seed → identical output, pixel for pixel.',
    loading: {
      label: 'Live archive syncing',
      description:
        'Real generated NFTs appear here as soon as indexed token metadata is available.',
    },
    showcase: {
      liveLabel: 'Live Signature',
      signalLabel: 'Signal',
      awaitingMetadataLabel: 'Awaiting metadata',
      viewAriaLabel: 'View Cosmic Signature {tokenLabel}',
      artworkAlt: 'Cosmic Signature artwork {tokenLabel}',
    },
    stageLabel: 'Stage',
    stages: [
      {
        number: '01',
        title: 'Seed',
        body: 'A 32-byte hash is derived from on-chain data — block information and ArbSys precompiles — then fed into a SHA3-256 RNG.',
      },
      {
        number: '02',
        title: 'Simulation',
        body: 'One hundred thousand candidate configurations run through a 4th-order Yoshida symplectic integrator at one million physics steps each.',
      },
      {
        number: '03',
        title: 'Selection',
        body: 'A Borda rank aggregation (chaos × equilateralness) selects the most visually interesting orbit from the candidate pool.',
      },
      {
        number: '04',
        title: 'Camera',
        body: 'A slow elliptical camera drift gives each Signature a cinematic parallax through the three-body dance.',
      },
      {
        number: '05',
        title: 'Color',
        body: 'Colors are mixed in the OKLab perceptual space with 120° hue separation per body, modulated by drift and a sine wave.',
      },
      {
        number: '06',
        title: 'Spectral Render',
        body: 'Sixty-four wavelength bins from 380 to 700 nanometers render the orbit trails with velocity-dependent thickness and depth of field.',
      },
      {
        number: '07',
        title: 'Signature',
        body: 'AgX tonemapping, bloom, OpenSimplex nebula layers, and color grading finish the frame. The result: a 16-bit PNG plus a 30-second H.265 video.',
      },
    ],
    facts: [
      { label: 'Wavelength bins', value: '64' },
      { label: 'Physics steps per candidate', value: '1,000,000' },
      { label: 'Candidate orbits', value: '100,000' },
      { label: 'License', value: 'CC0 1.0' },
    ],
  },

  tracks: {
    eyebrow: 'Allocation Tracks',
    heading: 'More than ten ways the protocol distributes the Cycle Reserve.',
    description:
      'When a cycle finalizes, the protocol distributes its ETH and CST reserves across allocation tracks that recognize endurance, timing, dedication, and participation. About half of the ETH reserve compounds into the next cycle.',
    cardLabel: 'Allocation',
    items: [
      {
        percent: '25%',
        title: 'Signature Allocation',
        body: `To the participant who made the Final Gesture. Includes 1,000 CST and ${nftAllocationFacts.mainPrizeNftPhrase.en}.`,
        tone: 'primary',
      },
      {
        percent: '~50%',
        title: 'Compounding Cycle Reserve',
        body: 'Rolls forward into the next Performance Cycle. The protocol compounds rather than extracts.',
        tone: 'aurora',
      },
      {
        percent: '8%',
        title: 'Chrono-Warrior Allocation',
        body: `To the participant who held the Endurance Champion position for the longest consecutive interval. Includes ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and one Cosmic Signature NFT.`,
        tone: 'rose',
      },
      {
        percent: '7%',
        title: 'Public Goods Allocation',
        body: 'Forwarded to Protocol Guild, the funding mechanism for 170+ Ethereum core contributors.',
        tone: 'impact',
      },
      {
        percent: '6%',
        title: 'Anchor Distribution',
        body: 'Distributed proportionally across all Cosmic Signature NFTs anchored to the protocol for this cycle.',
        tone: 'nebula',
      },
      {
        percent: '4%',
        title: 'ETH Stellar Selection',
        body: 'Split across three randomly selected participants. Selection frequency scales with gestures made.',
        tone: 'solar',
      },
      {
        percent: '10 NFTs',
        title: 'NFT Stellar Selection — Participants',
        body: `Ten randomly selected participants each receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and one Cosmic Signature NFT.`,
        tone: 'default',
      },
      {
        percent: '10 NFTs',
        title: 'Anchored-NFT Stellar Selection',
        body: `Ten randomly selected Random Walk NFT anchor-holders each receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and one Cosmic Signature NFT.`,
        tone: 'default',
      },
      {
        percent: '1,000 CST',
        title: 'Endurance Champion Allocation',
        body: '1,000 Recognition CST and one Cosmic Signature NFT to the participant with the longest unbroken endurance window.',
        tone: 'default',
      },
      {
        percent: '1,000 CST',
        title: 'Final CST Gesture Allocation',
        body: '1,000 Recognition CST and one Cosmic Signature NFT to the participant who made the last CST gesture of the cycle.',
        tone: 'default',
      },
    ],
  },

  anchoring: {
    eyebrow: 'Anchoring',
    heading: 'Anchor Cosmic Signature NFTs to the protocol.',
    body: `Anchored Cosmic Signature NFTs receive a proportional share of the ${ethDistributionFacts.anchorDistributionPercentage}% Anchor Distribution each cycle, paid out when the anchor is released. Release the anchor whenever you like — but each NFT can be anchored only once, so releasing permanently ends that NFT’s anchoring eligibility. Anchored Random Walk NFTs receive entries into the Anchored-NFT Stellar Selection, where selected anchor-holders receive ${protocolFacts.specialAllocationCst.toLocaleString('en-US')} CST and a Cosmic Signature NFT (no ETH).`,
    bullets: [
      'Per-cycle ETH accrual, retrieved at anchor release',
      'Release anchors at any time — each NFT anchors only once',
      'Random Walk anchors enter the Stellar Selection',
      'No fixed term and no penalties; releasing is permanent per NFT',
    ],
    cta: { label: 'Anchor in the App', href: `${APP_ORIGIN}/anchoring` },
  },

  publicGoods: {
    eyebrow: 'Public Goods',
    heading: '7% of every cycle funds Ethereum’s core contributors.',
    body: 'Every Performance Cycle forwards 7% of its ETH reserve to Protocol Guild — the collective funding mechanism for 170+ Ethereum core contributors. The more the protocol is used, the more flows to the infrastructure Ethereum itself depends on.',
    disclaimerHeading: 'Disclaimer',
    // lexicon-allow-start: explicit legal denial of charitable-tax-treatment framing.
    disclaimer:
      'This is a forwarding of ETH to a public-goods address (currently Protocol Guild). It is not a charitable contribution in the U.S. tax sense, and Cosmic Signature makes no representation about its tax treatment.',
    // lexicon-allow-end
    card: {
      label: 'Cycle Allocation',
      percentage: '7%',
      description: 'of every Performance Cycle is forwarded to Protocol Guild.',
      tableRows: [
        { label: 'Protocol Guild contributors', value: '170+' },
        { label: 'Enforcement', value: 'on-chain' },
        { label: 'Recipient', value: 'pg.eth' },
      ],
    },
    cta: { label: 'Learn about Protocol Guild', href: 'https://protocol-guild.readthedocs.io' },
  },

  council: {
    eyebrow: 'Cosmic Council',
    heading: 'Protocol Coordination, on-chain.',
    body: 'The Cosmic Council coordinates the protocol on-chain. CST holders delegate their weight (to themselves or another address), submit Coordination Proposals, and express Support or Opposition. The Coordination Quorum is met when Support plus Abstain weight reaches 3% of CST supply. Proposal threshold: 100 CST.',
    columns: [
      {
        title: 'Coordination Proposal',
        body: 'Any address with at least 100 CST of delegated weight may submit a proposal. Two-day coordination delay, two-week coordination period.',
      },
      {
        title: 'Coordination Weight',
        body: 'Each CST expresses one unit of weight once delegated. Expression is a cryptographic signature, not a share or equity instrument.',
      },
      {
        title: 'Coordination Quorum',
        body: 'A proposal passes if Support exceeds Opposition and Support plus Abstain weight reaches 3% of total CST supply. Opposition weight does not count toward the quorum.',
      },
    ],
  },

  verifiability: {
    eyebrow: 'Verifiability',
    heading: 'Open, verified, reproducible.',
    body: 'Anyone can verify a Signature by regenerating it from its seed. Contract verification, static analysis notes, and audit status are published through the app as reports become available. Project-owned materials in this repository are dedicated under CC0 1.0; third-party dependencies, fonts, and assets retain their own licenses.',
    pillars: [
      {
        title: 'CC0 1.0',
        body: 'Project-owned contracts, shaders, and rendering pipelines. No rights reserved. Third-party materials are excluded.',
      },
      {
        title: 'Verification Status',
        body: 'The app links public contract addresses, source-code resources, verification context, and audit/report status so anyone can inspect what has been published.',
      },
      {
        title: 'Reproducible Art',
        body: 'SHA-256 hashes of generated frames asserted in continuous integration. Same seed → identical output.',
      },
    ],
  },

  faq: {
    eyebrow: 'Clarifications',
    heading: 'Questions worth answering plainly.',
    items: [
      // lexicon-allow-start: explicit denial of lottery, casino, gambling, house, dealer, and bet categories.
      {
        question: 'Is this a lottery, casino, or gambling product?',
        answer:
          'No. Cosmic Signature is a procedural on-chain art protocol. Participants make gestures during a Performance Cycle; the protocol distributes allocations across more than ten tracks when the cycle finalizes. There is no house, no dealer, no bet. Allocations recognize endurance, timing, and participation. The one random allocation track, Stellar Selection, is a protocol-level procedural distribution.',
      },
      // lexicon-allow-end
      {
        question: 'What do I actually do as a participant?',
        answer:
          'You make gestures. Each gesture is an ETH or CST transaction that extends the Cycle Finalization Time, records a Stellar Selection entry, may imprint dynamic Participation CST, and shapes the cycle’s Signature. You may anchor Cosmic Signature NFTs to receive a share of Anchor Distributions. You may submit Coordination Proposals through the Cosmic Council if you hold at least 100 CST.',
      },
      {
        question: 'Why does the Participation CST amount change?',
        answer: isV3Mechanics
          ? `The Participation CST imprint accrues linearly with how long it has been since the previous gesture — about ${protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch} CST per minute at the launch parameters. Longer quiet periods create proportionally larger CST imprints, and gestures made immediately after another imprint close to 0 CST. The app previews the current amount before you submit.`
          : `The Participation CST imprint uses a square-root formula based on how long it has been since the previous gesture. Longer quiet periods create larger CST imprints, but the square root makes the increase sublinear. Very rapid gestures can imprint 0 CST. The app previews the current amount before you submit.`,
      },
      {
        question: 'How do ETH and CST gestures affect the CST Calibration Window?',
        answer: `The CST Calibration Window is stored on-chain and changes after every gesture. A CST gesture lengthens it by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%, making CST Gesture Cost descend more slowly. An ETH gesture shortens it by about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%, making CST Gesture Cost descend faster.`,
      },
      {
        question: 'Where do the ETH allocations come from?',
        answer:
          'From the Cycle Reserve, which grows as participants make gestures. When a cycle finalizes, about half rolls forward into the next cycle’s Compounding Reserve; the remainder is distributed across allocation tracks (Signature Allocation, Chrono-Warrior, Anchor Distribution, Stellar Selection, Public Goods) per on-chain parameters.',
      },
      // lexicon-allow-start: explicit investment and securities denial.
      {
        question: 'Is any of this an investment?',
        answer:
          'No. CST tokens express participation and coordination weight within the protocol, not equity, profit share, dividend, or investment contract. No team wallet receives ETH from participant gestures. Cosmic Signature makes no representation about token price or future behavior and does not solicit participation as an investment.',
      },
      // lexicon-allow-end
      // lexicon-allow-start: explicit denial of charitable-tax-treatment framing.
      {
        question: 'What exactly is Public Goods?',
        answer:
          'Seven percent of each cycle’s ETH reserve is forwarded to a public-goods address, currently Protocol Guild. Protocol Guild is the collective funding mechanism for 170+ Ethereum core contributors. This is a forwarding of ETH to a public-goods address; it is not a charitable contribution in the U.S. tax sense, and Cosmic Signature makes no representation about its tax treatment.',
      },
      // lexicon-allow-end
      {
        question: 'What is the art, technically?',
        answer:
          'Each Cosmic Signature NFT is a deterministic render of a three-body Newtonian simulation. The on-chain seed selects a candidate orbit (from 100,000 simulated via a 4th-order Yoshida symplectic integrator), which is then spectrally rendered across 64 wavelength bins with OKLab color mixing. The pipeline is fully open-source under CC0; anyone can reproduce a Signature from its seed.',
      },
      {
        question: 'Can I fork this?',
        answer:
          'Yes. Project-owned contracts, shaders, renderers, marketing pages, and documentation are dedicated under CC0 1.0 — no rights reserved. Third-party dependencies, fonts, and assets remain under their own licenses; see THIRD_PARTY_NOTICES.md.',
      },
    ],
  },

  footer: {
    brandName: 'Cosmic Signature',
    logoAlt: 'Cosmic Signature',
    tagline: 'A procedural on-chain art protocol on Arbitrum.',
    columns: [
      {
        heading: 'Protocol',
        links: [
          { label: 'Open the App', href: APP_ORIGIN },
          { label: 'About', href: '/about' },
          { label: 'Learn', href: '/learn' },
          { label: 'Documentation', href: `${APP_ORIGIN}/how-it-works` },
          { label: 'Contracts', href: `${APP_ORIGIN}/contracts` },
          { label: 'Source Code', href: `${APP_ORIGIN}/code` },
        ],
      },
      {
        heading: 'Ecosystem',
        links: [
          { label: 'Axiom Zero Marketplace', href: COSMIC_SIGNATURE_MARKETPLACE_URL },
          { label: 'Chaos Zero Predictions', href: CHAOS_ZERO_PREDICTIONS_URL },
          { label: 'Trade CST on Uniswap', href: CST_UNISWAP_SWAP_URL },
          { label: 'View CST pool on GeckoTerminal', href: CST_GECKOTERMINAL_POOL_URL },
        ],
      },
      {
        heading: 'Community',
        links: [
          { label: 'X / Twitter', href: 'https://x.com/CosmicSignature' },
          { label: 'Discord', href: 'https://discord.gg/bGnPn96Qwt' },
          { label: 'GitHub', href: 'https://github.com/PredictionExplorer' },
          { label: 'Protocol Guild', href: 'https://protocol-guild.readthedocs.io' },
        ],
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Terms', href: `${APP_ORIGIN}/terms` },
          { label: 'Privacy', href: `${APP_ORIGIN}/privacy` },
          { label: 'FAQ', href: '#faq' },
        ],
      },
    ],
    copyright: '© {year} Cosmic Signature. Project-owned materials: CC0 1.0.',
    colophon: 'CC0 1.0 · Publicly verifiable · Reproducible art',
  },

  notFound: {
    code: '404',
    heading: 'Off the star map.',
    description: 'This coordinate has drifted outside the protocol. Return to the Signature.',
    cta: { label: 'Back to the Signature', href: '/' },
  },
} as const satisfies LandingContent;
