import {
  cstRewardFacts,
  ethDistributionFacts,
  isV3Mechanics,
  protocolFacts,
} from '@/content/protocol-facts';

import type { FAQContent } from './types';

/**
 * Item IDs and hash anchors are public URL fragments. They intentionally
 * preserve legacy values because external backlinks depend on them.
 */
export const faqContentEn = {
  categories: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'The basics of Cosmic Signature and how to participate',
      icon: 'rocket',
      items: [
        {
          id: 'what-is-cosmic-signature',
          question: 'What is Cosmic Signature?',
          answer:
            'Cosmic Signature is a procedural on-chain art protocol on Arbitrum. Participants make gestures during a Performance Cycle; every gesture shapes the cycle’s final Signature. When the cycle finalizes, the protocol distributes its reserves across more than ten allocation tracks — including Protocol Guild, the funding mechanism for 170+ Ethereum core contributors.',
        },
        {
          id: 'is-cosmic-signature-related-to-biology',
          question: 'Is Cosmic Signature related to the COSMIC biology database?',
          answer:
            'No. Cosmic Signature is not related to the COSMIC cancer mutation database or COSMIC mutational signatures in biology. It is an on-chain art protocol and app focused on deterministic three-body NFT art.',
        },
        {
          id: 'how-does-the-bidding-game-work',
          question: 'How does a Performance Cycle work?',
          answer: `Each cycle opens with an ETH Calibration Window for the first gesture. That first gesture starts the Cycle Finalization Time, currently about 24 hours by default. Subsequent gestures with ETH or CST add the current time increment to the stored finalization time, with the increment starting at one hour and growing ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% per finalized cycle. When the Cycle Finalization Time expires, the participant who made the Final Gesture has an exclusive ${protocolFacts.finalGestureExclusivityHours}-hour window to finalize the cycle and retrieve the Signature Allocation; gestures remain possible until the cycle is actually finalized.`,
        },
        {
          id: 'what-type-of-gestures-are-available',
          question: 'What types of gestures are available?',
          answer:
            'Gestures can be made with ETH or CST tokens (ERC-20). The first gesture of every cycle must be an ETH gesture; after that, ETH and CST gestures can be mixed freely. You may also attach a Random Walk NFT to an ETH gesture to receive a 50% reduction in ETH Gesture Cost. Cosmic Signature NFTs (ERC-721) are allocation and anchoring assets; they are not accepted as gesture payment. CST gestures use their own Calibration Window: the CST Gesture Cost descends while the window runs, and the window length itself changes after every ETH or CST gesture.',
        },
        {
          id: 'can-i-participate-without-nfts',
          question: "Can I participate if I don't own any NFTs?",
          answer:
            'Yes. Anyone can participate in a Cosmic Signature Performance Cycle by making a gesture. An unused Random Walk NFT can be attached to an ETH gesture for a 50% Gesture Cost reduction.',
        },
        {
          id: 'how-can-i-get-involved',
          question: 'How can I get involved?',
          answer:
            'You can participate by making gestures during a Performance Cycle, or by contributing an NFT from your project to be attached to a participant’s gesture. Join the Discord to meet other participants.',
        },
        {
          id: 'how-long-does-each-round-last',
          question: 'How long does each Performance Cycle last?',
          answer: `Each cycle begins when the first ETH gesture is made, which starts the Cycle Finalization Time at roughly 24 times the current time increment (about one day at launch). Every later gesture adds the current time increment, which started at exactly one hour and grows ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% with each finalized cycle. A cycle can therefore last much longer than a day if gestures keep arriving before finalization.`,
        },
        {
          id: 'can-i-place-multiple-gestures',
          question: 'Can I make multiple gestures in one cycle?',
          answer:
            'Yes. Each gesture can imprint Participation CST into your wallet, increases your entry count for Stellar Selections, and shapes the cycle’s evolving Signature. The Participation CST amount is dynamic: it depends on how much time has passed since the previous gesture, so a longer quiet period creates a larger CST imprint than a rapid follow-up gesture.',
        },
      ],
    },
    {
      id: 'allocations-and-rewards',
      title: 'Allocations & Distributions',
      description: 'What participants may receive when the cycle finalizes',
      icon: 'trophy',
      items: [
        {
          id: 'what-is-the-main-allocation',
          question: 'What is the Signature Allocation?',
          answer: `The Signature Allocation is received by the participant who made the Final Gesture of a cycle. It includes one Cosmic Signature NFT, a Recognition CST imprint of 1,000 CST, and ${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve in ETH, plus any tokens or NFTs attached to participant gestures during the cycle.`,
          hashAnchor: 'main-allocation',
        },
        {
          id: 'what-rewards-per-bid',
          question: 'What do I receive for each gesture?',
          answer: `Every gesture records one entry in end-of-cycle Stellar Selections, updates your Endurance Window contribution toward the Endurance Champion and Chrono-Warrior tracks, and may imprint Participation CST. Participation CST is calculated with a ${isV3Mechanics ? 'linear' : 'square-root'} formula: ${cstRewardFacts.formula}. In plain English, the amount grows with the time since the previous gesture${isV3Mechanics ? ' at a steady rate' : ', but at a slowing rate'}. Very rapid gestures can receive 0 CST; a longer gap can produce a much larger CST imprint.`,
        },
        {
          id: 'how-does-the-stellarSelection-work',
          question: 'How does Stellar Selection work?',
          answer: `Each gesture records one entry in Stellar Selection. At the end of each cycle, the smart contract randomly selects entries from the pool: ${protocolFacts.ethStellarSelectionRecipients} selections share ${ethDistributionFacts.stellarSelectionEthPercentage}% of the Cycle Reserve in ETH, ${protocolFacts.nftStellarSelectionRecipients} selections each receive ${protocolFacts.specialAllocationCst.toLocaleString()} CST and a Cosmic Signature NFT, and ${protocolFacts.anchoredRwlkNftSelectionRecipients} selections among anchored Random Walk NFTs also receive ${protocolFacts.specialAllocationCst.toLocaleString()} CST and Cosmic Signature NFTs. Selections are drawn with replacement, so the same address can be selected more than once in a cycle. ${isV3Mechanics ? 'ETH selections are weighted by the undiscounted ETH cost of each gesture at the moment it was made, so costlier gestures are proportionally more likely to be selected; NFT selections remain one entry per gesture.' : 'Selection frequency increases with the number of gestures you make.'}`,
        },
        {
          id: 'how-random-selection-works',
          question: 'How are random selections made?',
          answer: `Stellar Selection uses on-chain randomness sources at cycle finalization time, including Arbitrum-provided block context and fallback entropy sources. ${isV3Mechanics ? 'Participant ETH Stellar Selection is cost-weighted: each entry carries the undiscounted ETH cost of its gesture, so costlier gestures are proportionally more likely to be selected. NFT Stellar Selection remains entry-weighted (one entry per gesture).' : 'Participant Stellar Selection is entry-weighted: each gesture adds an entry, so more gestures increase selection frequency.'} Anchored-NFT Stellar Selection is separate and is based on anchored Random Walk NFT eligibility rather than the participant gesture-entry pool.`,
        },
        {
          id: 'how-do-i-claim-my-allocation',
          question: 'How do I retrieve my allocation if I’m a recipient?',
          answer: `Recipients retrieve allocations through the app and protocol contracts. The Final Gesture participant has ${protocolFacts.finalGestureExclusivityHours} hours of exclusive time after the Cycle Finalization Time to finalize the cycle and retrieve the Signature Allocation. After that, the Open-Finalization Window begins: anyone may finalize the cycle, and the smart contract treats whoever finalizes as the cycle beneficiary — the finalizer receives the entire Signature Allocation (the ETH share, the ${protocolFacts.specialAllocationCst.toLocaleString()} CST imprint, the Cosmic Signature NFT, and priority over attached assets). Secondary ETH and attached-token or attached-NFT allocations sit in the Allocations Wallet escrow with a separate retrieval timeout that defaults to ${protocolFacts.secondaryRetrievalTimeoutWeeks} weeks; once it expires, the contracts permit anyone to retrieve an unretrieved allocation for themselves. Retrieve promptly.`,
        },
        {
          id: 'how-does-anchoring-work',
          question: 'How does Anchoring work?',
          answer: `Cosmic Signature NFTs can be anchored to the protocol to receive ETH Anchor Distributions: each finalized cycle allocates ${ethDistributionFacts.anchorDistributionPercentage}% of the Cycle Reserve, split equally per anchored Cosmic Signature NFT, and the accumulated ETH is paid out when you release the anchor. Random Walk NFTs can also be anchored, but only for Anchored-NFT Stellar Selection eligibility — selected anchor-holders receive CST and Cosmic Signature NFTs, not ETH. Two rules to know: every NFT can be anchored only once, ever (after you release an anchor, that NFT can never be anchored again), and if no Cosmic Signature NFTs are anchored when a cycle finalizes, that cycle's ${ethDistributionFacts.anchorDistributionPercentage}% simply stays in the Cycle Reserve. CST (ERC-20) cannot be anchored. Visit the My Anchors page (from your account menu) to manage anchors.`,
        },
        {
          id: 'what-are-marketing-rewards',
          question: 'What is the Outreach Reserve?',
          answer: `You can receive CST tokens (ERC-20) for helping promote the protocol. The Outreach Reserve imprints ${protocolFacts.outreachReserveCst.toLocaleString()} CST per cycle and distributes it to ecosystem contributors. Contact the Outreach Custodian via Discord for guidance.`,
        },
        {
          id: 'how-many-nfts-minted',
          question: 'How many Cosmic Signature NFTs are imprinted each cycle?',
          answer: `In the vast majority of cycles, ${protocolFacts.typicalNftsPerCycle} Cosmic Signature NFTs are imprinted: one for the Signature Allocation recipient, one for the Final CST Gesture recipient, one for the Endurance Champion, one for the Chrono-Warrior, ${protocolFacts.nftStellarSelectionRecipients} for NFT Stellar Selection recipients, and ${protocolFacts.anchoredRwlkNftSelectionRecipients} for Random Walk NFT anchor-holders selected through Anchored-NFT Stellar Selection. Each of those ${protocolFacts.typicalNftsPerCycle} NFT allocations also includes ${protocolFacts.specialAllocationCst.toLocaleString()} CST. If a cycle has no CST gestures or no anchored Random Walk NFTs, those specific imprints are skipped for that cycle.`,
        },
        {
          id: 'what-happens-to-remaining-eth',
          question: 'What happens to the remaining ETH in the Cycle Reserve?',
          answer:
            'About half of the Cycle Reserve rolls forward into the next Performance Cycle as the Compounding Cycle Reserve, increasing the starting balance for the following cycle. The protocol compounds rather than extracts.',
        },
        {
          id: 'what-happens-to-attached-assets',
          question: 'What happens to tokens or NFTs attached to gestures?',
          answer: `ERC-20 tokens or ERC-721 NFTs attached to gestures are held in escrow by the Allocations Wallet contract; they do not join the ETH Cycle Reserve. After finalization, the cycle beneficiary (normally the Final Gesture participant) has exclusive priority to retrieve them. If attached assets remain unretrieved past the secondary retrieval timeout, currently ${protocolFacts.secondaryRetrievalTimeoutWeeks} weeks by default, the contracts permit anyone to retrieve them for themselves.`,
        },
        {
          id: 'who-receives-10-percent',
          question: 'Who receives the public-goods allocation from the Cycle Reserve?',
          answer: `${ethDistributionFacts.publicGoodsPercentage}% of the Cycle Reserve is forwarded to the Public Goods Vault at finalization, and anyone can then forward the vault balance to the configured Public Goods Beneficiary. The current beneficiary is Protocol Guild — the collective funding mechanism for 170+ Ethereum core contributors. Today the beneficiary address is set by the protocol owner; the intent is for the Cosmic Council to direct it once ownership moves under Council control.`,
        },
      ],
    },
    {
      id: 'game-mechanics',
      title: 'Cycle Mechanics',
      description: 'Deep dive into gesture timing and protocol rules',
      icon: 'cycle',
      items: [
        {
          id: 'how-does-price-increase',
          question: 'How does Gesture Cost change across a cycle?',
          answer:
            'ETH and CST Gesture Costs follow separate on-chain paths. ETH Gesture Cost uses an ETH Calibration Window and then steps upward after ETH gestures. CST Gesture Cost descends through the current CST Calibration Window. That CST window is not static: ETH gestures shorten it slightly, while CST gestures lengthen it slightly, so the cost path reacts to the balance of ETH and CST participation.',
        },
        {
          id: 'what-is-dutch-auction',
          question: 'What is the Calibration Window?',
          answer: `A Calibration Window is a cost-discovery window in which Gesture Cost descends linearly from a Calibration Ceiling over a known duration. ETH gestures and CST gestures use separate windows with different floors: the ETH Gesture Cost descends to a floor of about 1/${protocolFacts.ethCalibrationFloorDivisor} of its ceiling, while the CST Gesture Cost descends all the way to ${protocolFacts.cstCalibrationFloorCst} — a free CST gesture is possible if the window fully elapses. The CST Calibration Window currently starts from a ${protocolFacts.initialCstCalibrationWindowHours}-hour reference, but it is stored on-chain and changes after every gesture: each CST gesture increases the window by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%, and each ETH gesture decreases it by about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%.`,
        },
        {
          id: 'how-is-participation-cst-calculated',
          question: 'How is Participation CST calculated?',
          answer: isV3Mechanics
            ? `Participation CST accrues linearly with elapsed time since the previous gesture: ${cstRewardFacts.formula}. At the launch parameters (a time increment of exactly one hour) the rate is about ${protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch} CST per minute — examples are approximately ${cstRewardFacts.examples.map((example) => `${example.cst} CST after ${example.elapsed}`).join(', ')}. The increment grows ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% per finalized cycle, so live amounts drift slightly below these over time. The live app preview and the contract are the source of truth for the exact amount at the moment your gesture lands.`
            : `Participation CST uses a square-root formula based on elapsed time since the previous gesture: ${cstRewardFacts.formula}. The square root matters because it rewards longer quiet periods without making the reward grow linearly forever. At the launch parameters (a time increment of exactly one hour), examples are approximately ${cstRewardFacts.examples.map((example) => `${example.cst} CST after ${example.elapsed}`).join(', ')}. The increment grows ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% per finalized cycle, so live amounts drift slightly below these over time. The live app preview and the contract are the source of truth for the exact amount at the moment your gesture lands.`,
        },
        {
          id: 'why-minimum-cst-reward-protection',
          question: 'What is Minimum CST Reward Protection?',
          answer:
            'Before you submit a gesture, the app previews the expected Participation CST amount and sends a minimum CST amount you are willing to accept. If another gesture lands first, your expected amount may change. Minimum CST Reward Protection can stop the transaction if the resulting CST imprint would be below your chosen minimum. You can also choose to accept any CST amount, including 0 CST, if you prefer the gesture to proceed whenever the cost checks pass.',
        },
        {
          id: 'how-cst-calibration-window-changes',
          question: 'How does each gesture change the CST Calibration Window?',
          answer: `Every ETH or CST gesture updates the stored CST Calibration Window. A CST gesture lengthens the window by duration / ${protocolFacts.cstCalibrationWindowChangeDivisor}, which is about +${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}% before integer truncation. An ETH gesture shortens it by approximately duration / ${protocolFacts.cstCalibrationWindowChangeDivisor + 1}, about -${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%. A shorter window makes CST Gesture Cost fall faster; a longer window makes it fall more slowly.`,
        },
        {
          id: 'what-is-open-finalization-window',
          question: 'What is the Open-Finalization Window?',
          answer: `When the Cycle Finalization Time expires, the Final Gesture participant has ${protocolFacts.finalGestureExclusivityHours} hours of exclusive time to finalize the cycle. If they do not finalize during that exclusivity window, anyone may call the finalization transaction — and the smart contract makes whoever finalizes the cycle beneficiary. The finalizer receives the full Signature Allocation (ETH share, ${protocolFacts.specialAllocationCst.toLocaleString()} CST, the Cosmic Signature NFT, and priority over attached assets), so the Final Gesture participant should finalize before the window ends. Open finalization keeps the protocol moving even if the Final Gesture participant disappears.`,
        },
        {
          id: 'what-is-endurance-champion',
          question: 'What is an Endurance Champion?',
          answer:
            'The participant who remained the most recent gesture maker for the longest consecutive interval within a cycle (the longest gap before another gesture arrived). When the cycle finalizes, the Endurance Champion receives a Recognition CST imprint of 1,000 CST and one Cosmic Signature NFT.',
          hashAnchor: 'endurance-champion',
        },
        {
          id: 'what-is-final-cst-gesture',
          question: 'What is the Final CST Gesture?',
          answer:
            'The Final CST Gesture is the last gesture made with CST tokens during a cycle. When the cycle finalizes, the participant who made it receives a Recognition CST imprint of 1,000 CST and one Cosmic Signature NFT.',
          hashAnchor: 'final-cst-gesture',
        },
        {
          id: 'what-is-chrono-warrior',
          question: 'What is a Chrono-Warrior?',
          answer: `The participant who held the Endurance Champion position for the longest consecutive interval. Analogous to the Endurance Champion being the longest-reigning recent gesture maker, the Chrono-Warrior is the longest-reigning Endurance Champion. When the cycle finalizes, the Chrono-Warrior receives ${ethDistributionFacts.chronoWarriorEthPercentage}% of the Cycle Reserve in ETH, ${protocolFacts.specialAllocationCst.toLocaleString()} CST, and one Cosmic Signature NFT.`,
          hashAnchor: 'chrono-warrior',
        },
        {
          id: 'does-time-per-bid-stay-same',
          question: 'Does the time added per gesture always stay the same?',
          answer: `No. The time added after each gesture started at exactly one hour at launch and grows by ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% every time a cycle finalizes. Because a larger increment also makes each cycle last longer, the growth naturally slows down in calendar time.`,
        },
        {
          id: 'why-time-per-bid-increases',
          question: 'Why does the time added per gesture increase over time?',
          answer:
            'The mechanism limits the long-term rate at which Cosmic Signature NFTs are imprinted. Slower cycles mean fewer new NFTs enter circulation per unit time, preserving scarcity.',
        },
        {
          id: 'how-time-increase-affects-game',
          question: 'How does the increase in time per gesture affect the protocol?',
          answer:
            'As the time added per gesture increases, cycles run longer on average. The change is gradual, preserving a smooth participation experience while limiting total Cosmic Signature NFT supply over long time horizons.',
        },
        {
          id: 'what-if-two-gestures-same-time',
          question: 'What happens if two gestures are submitted at the same time?',
          answer:
            'Transactions on Arbitrum are processed in the order they are included by the sequencer. If two gestures arrive at the same moment, the one confirmed first is the valid gesture.',
        },
        {
          id: 'is-there-game-theory',
          question: 'Is there a strategic element in Cosmic Signature?',
          answer:
            'Yes. Participant timing, gesture frequency, and method (ETH vs CST vs Random Walk attachment) all shape how allocations distribute. The social dynamics and protocol design are designed so that multiple strategies can succeed across different allocation tracks.',
        },
      ],
    },
    {
      id: 'tokens-and-nfts',
      title: 'Tokens & Cosmic Signatures',
      description: 'CST, the on-chain art, and digital assets',
      icon: 'gem',
      items: [
        {
          id: 'what-are-cst-and-dao',
          question: 'What are CST tokens and the Cosmic Council?',
          answer: `Every gesture can imprint CST tokens, which express Coordination Weight on the Cosmic Council. The Council coordinates the protocol on-chain: CST holders submit Coordination Proposals and express Support or Opposition (delegate your CST — to yourself or another address — to activate that weight). The Council is designed to direct protocol parameters, including which Public Goods Beneficiary receives the ${ethDistributionFacts.publicGoodsPercentage}% allocation, once contract ownership moves under Council control; today those settings are still managed by the protocol owner.`,
        },
        {
          id: 'what-can-i-do-with-cst',
          question: 'What can I do with CST tokens?',
          answer:
            'CST tokens can be used as an alternative to ETH for gestures through the CST Calibration Window; CST spent on a gesture is burned (permanently removed from supply) rather than pooled. Gestures can also imprint Participation CST, but the amount is dynamic and depends on how long it has been since the previous gesture. CST also expresses Coordination Weight on the Cosmic Council once delegated (you can delegate to yourself).',
        },
        {
          id: 'what-makes-nfts-unique',
          question: 'What makes Cosmic Signature NFTs unique?',
          answer:
            'Cosmic Signature NFTs are on-chain and self-sustaining. Each NFT is imprinted with a randomly generated seed stored in the smart contract. The image and video are rendered from this seed using an open-source Rust pipeline. The seed determines the three celestial bodies’ starting conditions, producing a unique chaotic trajectory for each NFT.',
        },
        {
          id: 'how-are-nft-images-created',
          question: 'How are the NFT images created?',
          answer:
            'Each Cosmic Signature NFT visualizes the three-body problem in Newtonian gravity. The pipeline simulates three celestial bodies under gravity and spectrally renders their trajectories across 64 wavelength bins spanning 380–700 nanometers, creating a unique chaotic pattern for every NFT.',
        },
        {
          id: 'significance-of-random-seed',
          question: 'Why is each NFT generated from an on-chain seed?',
          answer:
            'The seed-based pipeline ensures long-term reproducibility. Unlike NFT projects whose images rely on centralized servers, every Cosmic Signature NFT’s seed is stored on Arbitrum. Anyone can independently regenerate the NFT image and video at any time using the open-source Rust pipeline — pixel-for-pixel identical to the original.',
        },
        {
          id: 'is-nft-supply-limited',
          question: 'Is the number of Cosmic Signature NFTs limited?',
          answer: `Yes, in practice. The time added per gesture grows ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}% with every finalized cycle, so cycles gradually lengthen and the pace of NFT imprinting slows. There is no hard supply cap in the contract, but the slowing cycle rhythm makes Cosmic Signature NFTs an increasingly scarce resource over time.`,
        },
        {
          id: 'impact-of-limiting-nfts',
          question: 'What is the impact of the limited NFT supply?',
          answer:
            'The growing gesture-time increment and slowing imprint pace preserve scarcity. Each new Cosmic Signature NFT represents a progressively rarer slice of the cumulative protocol history.',
        },
        {
          id: 'connection-with-randomwalknft',
          question: 'What is the connection with Random Walk NFT?',
          answer:
            'Random Walk NFT holders can attach an unused token to one ETH gesture for a 50% ETH Gesture Cost reduction. Random Walk NFT anchor-holders also receive entries into the Anchored-NFT Stellar Selection each cycle.',
        },
        {
          id: 'how-to-trade-nfts-tokens',
          question: 'How can I trade or sell my Cosmic Signature NFTs or CST?',
          answer:
            'Cosmic Signature NFTs trade on Axiom Zero (axiomzero.market), the zero-fee NFT marketplace built for Cosmic Signature and Random Walk NFTs, and CST trades on Uniswap on Arbitrum. Both are standard ERC-721 and ERC-20 assets, so any other Arbitrum marketplace or exchange that supports those standards works too, including OpenSea.',
        },
        {
          id: 'where-to-buy-cosmic-signature-nfts',
          question: 'Where can I buy or sell Cosmic Signature NFTs?',
          answer:
            'The primary venue is Axiom Zero (https://www.axiomzero.market/cosmic-signature), a zero-fee NFT marketplace on Arbitrum built for fair-launch generative art. Listings and sales settle directly on-chain, sellers receive the full sale amount, and every token page shows the NFT’s anchor status read live from the anchoring contracts — a never-anchored token keeps its one-time anchoring option open for its next owner.',
        },
        {
          id: 'cosmic-signature-prediction-market',
          question: 'Is there a prediction market for Cosmic Signature?',
          answer:
            'Yes. Chaos Zero (https://chaoszero.com) is a prediction market built specifically for Cosmic Signature. Each Performance Cycle it opens one question: will this cycle finalize with more gestures than the previous one? Positions are denominated in CST and fully collateralized by construction, and markets resolve from the public on-chain gesture count with no owner or admin keys.',
        },
        {
          id: 'participate-dao-without-bidding',
          question: 'Can I participate in the Cosmic Council without making a gesture?',
          answer:
            'Yes. You can acquire CST on a supported exchange and use it to express Coordination Weight on the Cosmic Council after delegating it (to yourself or another address). Making gestures remains the primary way to imprint new CST.',
        },
        {
          id: 'donate-nfts-to-game',
          question: 'How can other NFT projects contribute their tokens to a cycle?',
          answer:
            'Projects can attach their tokens (ERC-721 or ERC-20) to a gesture using the "Advanced" pane. Provide the contract address and token ID or amount and submit the gesture. Attached tokens are held in the Allocations Wallet escrow and flow to the Signature Allocation recipient after finalization.',
        },
      ],
    },
    {
      id: 'arbitrum-and-technical',
      title: 'Arbitrum & Technical',
      description: 'Network setup, wallets, and technical details',
      icon: 'layers',
      items: [
        {
          id: 'what-is-arbitrum',
          question: 'What is Arbitrum and why is Cosmic Signature deployed on it?',
          answer:
            'Arbitrum is an Ethereum Layer 2 rollup that speeds up transactions and reduces fees. Cosmic Signature deploys on Arbitrum to offer sub-cent gas costs and faster finality while preserving Ethereum’s security guarantees.',
        },
        {
          id: 'why-arbitrum-not-ethereum',
          question: 'Why Arbitrum and not Ethereum mainnet?',
          answer:
            'Most on-chain activity is migrating to Layer 2s. Arbitrum offers dramatically lower gas costs while maintaining the same security model as Ethereum Layer 1 — making it the right home for a gesture-heavy protocol like Cosmic Signature.',
        },
        {
          id: 'arbitrum-security',
          question: 'What makes Arbitrum as secure as Ethereum Layer 1?',
          answer:
            'Arbitrum is a rollup, not a sidechain. Every batch of transactions is posted back to Ethereum mainnet. This anchors Arbitrum’s security in Ethereum itself: the data and dispute resolution live on Layer 1.',
        },
        {
          id: 'how-to-get-eth-on-arbitrum',
          question: 'How do I get ETH on Arbitrum?',
          answer:
            'Bridge ETH from Ethereum mainnet using the official Arbitrum bridge or other supported bridges. Your ETH is locked on Ethereum and an equivalent amount becomes available on Arbitrum. Bridging requires an Ethereum Layer 1 gas payment.',
        },
        {
          id: 'existing-wallet-on-arbitrum',
          question: 'Can I use my existing Ethereum wallet on Arbitrum?',
          answer:
            'Yes. The same private keys sign transactions on both networks. You just need to add the Arbitrum network to your wallet’s network list.',
        },
        {
          id: 'view-tokens-on-arbitrum',
          question: 'How do I view my CST tokens and Cosmic Signature NFTs on Arbitrum?',
          answer:
            'View them directly on the Cosmic Signature website, or add the contract addresses to your wallet manually. Contract addresses are published on the Contracts page and in the community Discord.',
        },
        {
          id: 'trade-on-arbitrum',
          question: 'Can I trade my Cosmic Signature NFTs and CST on Arbitrum?',
          answer:
            'Yes. Cosmic Signature NFTs trade on Axiom Zero, the zero-fee marketplace for the collection, and CST trades on Uniswap. Both are standard ERC-721 and ERC-20 assets on Arbitrum, so any marketplace or exchange that supports those standards works. Always confirm the contract address before trading.',
        },
        {
          id: 'verify-bid-success',
          question: 'How can I confirm that my gesture was submitted successfully?',
          answer:
            'Successful gestures are confirmed on Arbitrum and visible on the Arbitrum block explorer (Arbiscan). Your transaction hash can be pasted into the explorer to verify the gesture.',
        },
        {
          id: 'game-security',
          question: 'How is the protocol’s security ensured?',
          answer:
            'Cosmic Signature publishes contract addresses, source-code resources, and verification context so the community can inspect behavior independently. Formal audit reports and verification notes should be read from the Audits page as they are published or updated.',
        },
        {
          id: 'fees-involved',
          question: 'Are there any fees involved?',
          answer:
            'Beyond the Gesture Cost itself, you pay Arbitrum network gas fees for each transaction. Gas fees fluctuate with network conditions and are not controlled by Cosmic Signature.',
        },
      ],
    },
    {
      id: 'trust-and-governance',
      title: 'Trust & Coordination',
      description: 'Transparency, team control, and the open-source vision',
      icon: 'shield',
      items: [
        {
          id: 'team-controls',
          question: 'What controls does the team have over the protocol?',
          answer:
            'Initially, the team has the ability to adjust certain parameters of the protocol, such as gesture-time increments or allocation-track percentages. This control is implemented through the smart contract\'s "Ownable" pattern and is scoped to the inter-cycle window: once the next cycle activates — which happens before its first gesture — the core protocol parameters are locked until that cycle finalizes. A few narrower controls remain available outside that lock: the owner can postpone a cycle’s activation until its first gesture arrives, adjust the delay before the next cycle at any time, and manage peripheral contracts (the Public Goods Vault beneficiary, NFT metadata URIs, and the Allocations Wallet retrieval timeout) at any time. The protocol contract is also upgradeable (UUPS) by the owner, but only between cycles; the currently deployed implementation is the publicly verified V2.',
        },
        {
          id: 'will-team-always-have-control',
          question: "Will the team always have control over the protocol's parameters?",
          answer:
            'No. Once the protocol is stable, ownership transfers to the Cosmic Council. Parameter changes thereafter occur only through Protocol Coordination proposals that clear the Coordination Quorum.',
        },
        {
          id: 'what-is-renounce-ownership',
          question: 'What does "renouncing ownership" mean?',
          answer:
            'Renouncing ownership is an Ownable-contract function that permanently transfers control away from the deployer address. Once called, no privileged role can modify the contract’s parameters.',
        },
        {
          id: 'why-renounce-ownership',
          question: 'Why would the team renounce ownership?',
          answer:
            'The goal is a fair and decentralized protocol. Renouncing ownership ensures that the protocol’s rules cannot be changed arbitrarily once live — strengthening trust and predictability for participants.',
        },
        {
          id: 'how-team-profits',
          question: 'How does the Cosmic Signature team receive value from the protocol?',
          answer:
            'No team wallet receives ETH from participant gestures. All ETH flows into the Cycle Reserve and is distributed per the allocation tracks. The team’s alignment with the protocol is held indirectly through Random Walk NFTs; success of the protocol may increase the cultural value of those NFTs. Primary motivations are curiosity, creativity, and contributing to open-source public goods.',
        },
        {
          id: 'why-was-cs-created',
          question: 'Why was Cosmic Signature created?',
          answer:
            'Cosmic Signature was born from a fascination with chaos theory and the unsolvable nature of the three-body problem. The idea of unique, deterministic art generated from on-chain seeds was both intriguing and fitting for a public-goods-aligned protocol.',
        },
        {
          id: 'what-if-team-disappears',
          question: 'What if the team disappears?',
          answer:
            'The protocol is designed to be self-sustaining. Seeds are stored on-chain; anyone can regenerate NFT images and videos using the open-source Rust pipeline. This ensures the continued availability of every Cosmic Signature NFT regardless of the team’s status.',
        },
        {
          id: 'can-create-competing-site',
          question: 'Can I fork this and build my own site?',
          answer:
            'Absolutely. Project-owned contracts, shaders, renderers, pages, and documentation are dedicated under CC0 1.0 — no rights reserved. Third-party dependencies, fonts, and assets retain their own licenses; see THIRD_PARTY_NOTICES.md.',
        },
        {
          id: 'donate-to-pot',
          question: 'Can I contribute ETH to the Cycle Reserve without making a gesture?',
          answer:
            'Yes. The protocol contract exposes dedicated contribution functions that accept ETH independent of a gesture, and you may attach a note that can surface on the cycle’s contribution list. Use the app’s contribution flow rather than a plain wallet transfer: ETH sent directly to the protocol address is processed as an ETH gesture, not as a contribution. Reach out via Discord for details.',
        },
        {
          id: 'get-help',
          question: 'How can I get help if I have questions?',
          answer:
            'The community and support team are available via Discord, X / Twitter, and the support email listed on the Contacts page.',
        },
        {
          id: 'stay-updated',
          question: 'How can I stay updated on Cosmic Signature news?',
          answer:
            'Follow the official social media channels and join the Discord community for the latest announcements, protocol coordination proposals, and cycle recaps.',
        },
      ],
    },
  ],
  // lexicon-allow-start — legacy public URL fragment IDs are immutable.
  popularQuestionIds: [
    'what-is-cosmic-signature',
    'what-is-the-main-allocation',
    'how-does-the-stellarSelection-work',
    'how-does-anchoring-work',
  ],
  // lexicon-allow-end
} as const satisfies FAQContent;
