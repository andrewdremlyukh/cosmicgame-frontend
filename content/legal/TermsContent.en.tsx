import { ethDistributionFacts, isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { TermsContent, type TermsCopy } from './TermsContent';

export const termsCopyEn = {
  title: 'Terms of Service',
  subtitle:
    'Please read these terms carefully before using Cosmic Signature. By using our platform, you agree to be bound by these terms.',
  homeLabel: 'Home',
  lastUpdated: 'Last updated: July 20, 2026',
  sections: [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: [
        {
          id: 'acceptance',
          text: 'By accessing and using Cosmic Signature, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.',
        },
        {
          id: 'binding-agreement',
          text: 'These terms constitute a legally binding agreement between you and Cosmic Signature. We reserve the right to modify these terms at any time, and such modifications will be effective immediately upon posting.',
        },
      ],
    },
    {
      id: 'eligibility',
      title: 'Eligibility and Account Requirements',
      content: [
        {
          id: 'age',
          subtitle: 'Age Requirement',
          text: 'You must be at least 18 years old to use Cosmic Signature. By using this platform, you represent and warrant that you meet this age requirement.',
        },
        {
          id: 'wallet',
          subtitle: 'Wallet Responsibility',
          text: 'You are solely responsible for maintaining the security of your Web3 wallet and private keys. Cosmic Signature will never ask for your private keys or seed phrase. Loss of access to your wallet may result in permanent loss of NFTs and funds.',
        },
        {
          id: 'compliance',
          subtitle: 'Legal Compliance',
          text: 'You agree to comply with all applicable laws and regulations in your jurisdiction when using Cosmic Signature, including those related to cryptocurrency and blockchain technology.',
        },
      ],
    },
    {
      id: 'mechanics',
      title: 'Protocol Mechanics and Smart Contracts',
      content: [
        {
          id: 'protocol',
          subtitle: 'How the Protocol Works',
          text: 'Cosmic Signature is a decentralized, procedural on-chain art protocol where participants make gestures with ETH or CST tokens during a Performance Cycle. Gestures extend the Cycle Finalization Time, record protocol entries, and may imprint dynamic Participation CST according to the smart contract formula. When the Cycle Finalization Time expires, the participant who made the Final Gesture may retrieve the Signature Allocation. Additional allocations are distributed according to the published allocation-track structure.',
        },
        {
          id: 'dynamic-cst',
          subtitle: 'Dynamic CST Imprints',
          text: isV3Mechanics
            ? 'Participation CST imprinted by a gesture is not fixed. The amount accrues linearly with how much time has elapsed since the previous gesture, and part of each imprint is credited to the participant being outbid. Very rapid gestures may imprint 0 CST.'
            : 'Participation CST imprinted by a gesture is not fixed. The amount depends on how much time has elapsed since the previous gesture and is calculated with a square-root formula. Very rapid gestures may imprint 0 CST.',
        },
        {
          id: 'cst-window',
          subtitle: 'CST Calibration Window',
          text: isV3Mechanics
            ? 'The CST Gesture Cost descends through a Calibration Window. Each CST gesture restarts the window at twice the price it paid (subject to an on-chain minimum), and the cost then declines at a steady on-chain rate until it reaches zero or another CST gesture lands.'
            : `The CST Gesture Cost descends through a Calibration Window stored on-chain. Each CST gesture increases that window by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%, and each ETH gesture decreases it by about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%.`,
        },
        {
          id: 'smart-contract',
          subtitle: 'Smart Contract Interaction',
          text: 'All protocol actions are executed through smart contracts on the Arbitrum network. Once a transaction is confirmed on-chain, it cannot be reversed. You acknowledge that blockchain transactions are final and irreversible.',
        },
        {
          id: 'gas',
          subtitle: 'Gas Fees',
          text: 'You are responsible for paying all Arbitrum network gas fees associated with your transactions. Gas fees are separate from Gesture Cost and are paid to the network, not to Cosmic Signature.',
        },
        {
          id: 'random-walk',
          subtitle: 'Random Walk NFT Cost Reduction',
          text: 'A Random Walk NFT can be attached once to an ETH gesture to receive a 50% ETH Gesture Cost reduction. This action is permanent and cannot be undone. Once used, a Random Walk NFT cannot be used again for a cost reduction.',
        },
      ],
    },
    {
      id: 'allocations',
      title: 'Allocations and Distributions',
      content: [
        {
          id: 'distribution',
          subtitle: 'Allocation Distribution',
          text: `Allocations are distributed automatically according to the smart contract rules. In a typical cycle, ${protocolFacts.typicalNftsPerCycle} Cosmic Signature NFTs and ${protocolFacts.typicalCstImprintsPerCycle.toLocaleString()} CST are imprinted across the allocation tracks below.`,
        },
        {
          id: 'signature',
          subtitle: 'Signature Allocation',
          text: `The participant who made the Final Gesture may retrieve ${ethDistributionFacts.mainEthPercentage}% ETH, ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST, one Cosmic Signature NFT, and attached tokens from the cycle, if any.`,
        },
        {
          id: 'chrono',
          subtitle: 'Chrono-Warrior',
          text: `The participant who held the Endurance Champion position for the longest consecutive interval receives ${ethDistributionFacts.chronoWarriorEthPercentage}% ETH, ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST, and one Cosmic Signature NFT.`,
        },
        {
          id: 'endurance',
          subtitle: 'Endurance Champion',
          text: `The participant with the longest uninterrupted most-recent-gesture interval receives ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST and one Cosmic Signature NFT.`,
        },
        {
          id: 'final-cst',
          subtitle: 'Final CST Gesture',
          text: `The participant who made the last CST gesture of the cycle receives ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST and one Cosmic Signature NFT.`,
        },
        {
          id: 'eth-selection',
          subtitle: 'ETH Stellar Selection',
          text: `${protocolFacts.ethStellarSelectionRecipients} selected participants share ${ethDistributionFacts.stellarSelectionEthPercentage}% ETH from the Cycle Reserve.`,
        },
        {
          id: 'nft-selection',
          subtitle: 'NFT Stellar Selection',
          text: `${protocolFacts.nftStellarSelectionRecipients} selected participants each receive ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST and one Cosmic Signature NFT.`,
        },
        {
          id: 'anchored-selection',
          subtitle: 'Anchored-NFT Stellar Selection',
          text: `${protocolFacts.anchoredRwlkNftSelectionRecipients} selected RandomWalk NFT anchor-holders each receive ${protocolFacts.specialAllocationCst.toLocaleString()} Recognition CST and one Cosmic Signature NFT.`,
        },
        {
          id: 'anchor-distribution',
          subtitle: 'Anchor Distribution',
          text: `${ethDistributionFacts.anchorDistributionPercentage}% ETH is distributed proportionally across all anchored Cosmic Signature NFTs.`,
        },
        {
          id: 'public-goods',
          subtitle: 'Public Goods',
          text: `${ethDistributionFacts.publicGoodsPercentage}% ETH is forwarded to Protocol Guild, the current Public Goods Beneficiary.`,
        },
        {
          id: 'compounding',
          subtitle: 'Compounding Cycle Reserve',
          text: `Approximately ${protocolFacts.compoundingReservePercentage}% of the Cycle Reserve rolls forward into the next Performance Cycle.`,
        },
        {
          id: 'outreach',
          subtitle: 'Outreach Reserve',
          text: `${protocolFacts.outreachReserveCst.toLocaleString()} CST per cycle is imprinted for outreach distributions and ecosystem contributors.`,
        },
        {
          id: 'retrieval',
          subtitle: 'Retrieving Allocations',
          text: `Some allocations require manual retrieval through the platform. The participant eligible for the Signature Allocation has ${protocolFacts.finalGestureExclusivityHours} hours after the Cycle Finalization Time to finalize the cycle exclusively. After that window, anyone may finalize the cycle, and under the smart contract rules the finalizer becomes the cycle beneficiary and receives the Signature Allocation. Secondary ETH and attached-token or attached-NFT allocations use a separate retrieval timeout that defaults to ${protocolFacts.secondaryRetrievalTimeoutWeeks} weeks; after it expires, the smart contracts permit anyone to retrieve unretrieved allocations for themselves. You are responsible for retrieving your allocations before these timeouts expire.`,
        },
        {
          id: 'no-guarantee',
          subtitle: 'No Guaranteed Outcomes',
          text: 'Participation in Cosmic Signature does not guarantee any outcome. All gestures are considered final, and you may not recover the full amount of your Gesture Cost. Never make gestures with funds you cannot afford to forgo.',
        },
      ],
    },
    {
      id: 'risks',
      title: 'Risks and Disclaimers',
      content: [
        {
          id: 'blockchain-risk',
          subtitle: 'Blockchain Technology Risks',
          text: 'You acknowledge the risks inherent in blockchain technology, including but not limited to: smart contract vulnerabilities, network congestion, gas price volatility, regulatory changes, and potential loss of funds due to technical issues.',
        },
        {
          id: 'warranties',
          subtitle: 'No Warranties',
          text: "Cosmic Signature is provided 'as is' without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free from harmful components.",
        },
        {
          id: 'volatility',
          subtitle: 'Market Volatility',
          text: 'Cryptocurrency and NFT markets are highly volatile. The value of ETH, CST tokens, and NFTs may fluctuate significantly. Past performance is not indicative of future results.',
        },
        {
          id: 'audits',
          subtitle: 'Smart Contract Audits',
          text: 'While we strive to ensure the security of our smart contracts, no audit can guarantee complete security. You use the platform at your own risk.',
        },
      ],
    },
    {
      id: 'prohibited',
      title: 'Prohibited Activities',
      content: [
        {
          id: 'intro',
          text: 'You agree not to engage in any of the following prohibited activities:',
        },
        {
          id: 'exploit',
          text: '• Attempting to manipulate or exploit the protocol mechanics through bugs, glitches, or vulnerabilities',
        },
        {
          id: 'automation',
          text: '• Using bots, scripts, or automated tools to interact with the platform',
        },
        {
          id: 'collusion',
          text: '• Engaging in any form of market manipulation or collusion with other users',
        },
        {
          id: 'security',
          text: "• Attempting to hack, reverse engineer, or compromise the platform's security",
        },
        {
          id: 'law',
          text: '• Violating any applicable laws or regulations',
        },
        {
          id: 'accounts',
          text: '• Creating multiple accounts to gain unfair advantages',
        },
        {
          id: 'malicious',
          text: '• Uploading malicious content or attempting denial-of-service attacks',
        },
      ],
    },
  ],
  additionalTitle: 'Additional Terms',
  additional: [
    {
      id: 'intellectual-property',
      subtitle: 'Intellectual Property',
      text: 'Project-owned materials covered by the repository’s root LICENSE are dedicated under CC0 1.0. Third-party dependencies, fonts, assets, and other third-party materials retain their own licenses and are not included in that dedication; see THIRD_PARTY_NOTICES.md. CC0 does not waive trademark or patent rights. Any material not covered by CC0 or a stated open-source license remains the property of its respective rights holder and is protected by applicable intellectual property laws. NFTs received through the protocol grant you ownership of the specific token, but not the underlying intellectual property unless explicitly stated.',
    },
    // lexicon-allow-start: boilerplate limitation-of-liability language must preserve "profits".
    {
      id: 'liability',
      subtitle: 'Limitation of Liability',
      text: 'To the maximum extent permitted by law, Cosmic Signature and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.',
    },
    // lexicon-allow-end
    {
      id: 'indemnification',
      subtitle: 'Indemnification',
      text: 'You agree to indemnify and hold harmless Cosmic Signature and its affiliates from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the platform, your violation of these terms, or your violation of any rights of another party.',
    },
    {
      id: 'disputes',
      subtitle: 'Dispute Resolution',
      text: 'Any disputes arising from these terms or your use of Cosmic Signature shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive any right to a jury trial or to participate in a class action lawsuit.',
    },
    {
      id: 'law',
      subtitle: 'Governing Law',
      text: 'These terms shall be governed by and construed in accordance with the laws of the jurisdiction where Cosmic Signature operates, without regard to its conflict of law provisions.',
    },
    {
      id: 'severability',
      subtitle: 'Severability',
      text: 'If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
    },
    {
      id: 'agreement',
      subtitle: 'Entire Agreement',
      text: 'These terms constitute the entire agreement between you and Cosmic Signature regarding your use of the platform and supersede any prior agreements.',
    },
    {
      id: 'contact',
      subtitle: 'Contact Information',
      text: 'If you have questions about these Terms of Service, please contact us through our official community channels or GitHub repository.',
    },
  ],
  // lexicon-allow-start: Howey-test denial copy must explicitly negate an investment framing.
  warning: {
    title: 'Important warning',
    text: 'Participating in Cosmic Signature involves financial risk. Cryptocurrency and NFT markets are highly volatile, and you may not recover the value of your gestures. Never make gestures with funds you cannot afford to forgo. Cosmic Signature is not an investment product, makes no representation about token price or future behavior, and does not solicit participation as an investment. Always do your own research and consider your financial situation carefully before participating.',
  },
  // lexicon-allow-end
  acknowledgment: {
    title: 'Acknowledgment',
    text: 'By using Cosmic Signature, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. You also acknowledge that you understand the risks associated with blockchain technology, cryptocurrency, and NFTs.',
  },
} as const satisfies TermsCopy;

export function TermsContentEn() {
  return <TermsContent copy={termsCopyEn} />;
}
