import {
  ethDistributionFacts,
  isV3Mechanics,
  nftAllocationFacts,
  protocolFacts,
} from '@/content/protocol-facts';

import { TermsContent, type TermsCopy } from './TermsContent';

export const termsCopyZh = {
  title: '服务条款',
  subtitle: '使用 Cosmic Signature 前，请仔细阅读本条款。使用本平台即表示你同意受本条款约束。',
  homeLabel: '首页',
  lastUpdated: '最后更新：2026年7月20日',
  sections: [
    {
      id: 'acceptance',
      title: '接受条款',
      content: [
        {
          id: 'acceptance',
          text: '访问及使用 Cosmic Signature，即表示你接受并同意受本服务条款约束。若不同意本条款，请勿使用本平台。',
        },
        {
          id: 'binding-agreement',
          text: '本条款构成你与 Cosmic Signature 之间具有法律约束力的协议。我们保留随时修改本条款的权利；修改内容一经发布即刻生效。',
        },
      ],
    },
    {
      id: 'eligibility',
      title: '资格与账户要求',
      content: [
        {
          id: 'age',
          subtitle: '年龄要求',
          text: '你必须年满 18 周岁方可使用 Cosmic Signature。使用本平台即表示你声明并保证符合该年龄要求。',
        },
        {
          id: 'wallet',
          subtitle: '钱包责任',
          text: '你须自行负责 Web3 钱包与私钥的安全。Cosmic Signature 绝不会索取私钥或助记词。若失去钱包访问权限，可能永久失去 NFT 与资金。',
        },
        {
          id: 'compliance',
          subtitle: '遵守法律',
          text: '使用 Cosmic Signature 时，你同意遵守所在司法管辖区的一切适用法律法规，包括与加密货币及区块链技术有关的规定。',
        },
      ],
    },
    {
      id: 'mechanics',
      title: '协议机制与智能合约',
      content: [
        {
          id: 'protocol',
          subtitle: '协议运作方式',
          text: 'Cosmic Signature 是去中心化的程序化链上艺术协议。参与者在演绎周期中使用 ETH 或 CST 代币落笔。落笔会延长周期收官倒计时、记录协议资格，并可能依据智能合约公式铭刻动态参与 CST。周期收官倒计时结束后，完成收官之笔的参与者可以取回签名分配；其他分配则按照已公布的分配轨道结构发放。',
        },
        {
          id: 'dynamic-cst',
          subtitle: '动态 CST 铭刻',
          text: isV3Mechanics
            ? '每笔落笔铭刻的参与 CST 并非固定数量，而是随距上一笔落笔经过的时间线性累积，且每次铭刻的一部分会记入被超越的参与者。极短间隔的落笔可能铭刻 0 CST。'
            : '每笔落笔铭刻的参与 CST 并非固定数量，而是取决于距上一笔落笔经过的时间，并按平方根公式计算。极短间隔的落笔可能铭刻 0 CST。',
        },
        {
          id: 'cst-window',
          subtitle: 'CST 校准窗口',
          text: isV3Mechanics
            ? 'CST 落笔价格会在校准窗口中逐步下降。每笔 CST 落笔会以其成交价的两倍（受链上最低值约束）重启该窗口，之后价格按链上恒定速率下降，直至归零或另一笔 CST 落笔成交。'
            : `CST 落笔价格会在链上存储的校准窗口中逐步下降。每笔 CST 落笔会使该窗口增加约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%，每笔 ETH 落笔会使其减少约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%。`,
        },
        {
          id: 'smart-contract',
          subtitle: '智能合约交互',
          text: '所有协议操作都通过 Arbitrum 网络上的智能合约执行。交易一经链上确认便无法撤销。你确认知悉区块链交易具有最终性且不可逆。',
        },
        {
          id: 'gas',
          subtitle: '燃料费',
          text: '你须支付与自身交易有关的全部 Arbitrum 网络燃料费。燃料费与落笔价格相互独立，支付给网络，而非 Cosmic Signature。',
        },
        {
          id: 'random-walk',
          subtitle: 'Random Walk NFT 价格减免',
          text: '一枚 Random Walk NFT 可附加至一笔 ETH 落笔，使 ETH 落笔价格降低 50%。该操作永久有效且无法撤销；使用后，同一枚 Random Walk NFT 不得再次用于价格减免。',
        },
      ],
    },
    {
      id: 'allocations',
      title: '分配与派发',
      content: [
        {
          id: 'distribution',
          subtitle: '分配发放',
          text: `分配按照智能合约规则自动发放。通常，每个周期会沿下列分配轨道铭刻 ${nftAllocationFacts.typicalNftsPerCycle} 枚 Cosmic Signature NFT 与 ${protocolFacts.typicalCstImprintsPerCycle.toLocaleString()} CST。`,
        },
        {
          id: 'signature',
          subtitle: '签名分配',
          text: `完成收官之笔的参与者可以取回 ${ethDistributionFacts.mainEthPercentage}% 的 ETH、${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻、${nftAllocationFacts.mainPrizeNftPhrase.zh}，以及该周期中可能存在的已附加代币。`,
        },
        {
          id: 'chrono',
          subtitle: '时之勇士',
          text: `连续保持坚守冠军身份时间最长的参与者将获得 ${ethDistributionFacts.chronoWarriorEthPercentage}% 的 ETH、${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻与 1 枚 Cosmic Signature NFT。`,
        },
        {
          id: 'endurance',
          subtitle: '坚守冠军',
          text: `连续保持"最近一笔落笔者"身份时间最长的参与者将获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻与 1 枚 Cosmic Signature NFT。`,
        },
        {
          id: 'final-cst',
          subtitle: 'CST 收官之笔',
          text: `完成本周期最后一笔 CST 落笔的参与者将获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻与 1 枚 Cosmic Signature NFT。`,
        },
        {
          id: 'eth-selection',
          subtitle: 'ETH 星选',
          text: `${protocolFacts.ethStellarSelectionRecipients} 位获配者共同分得周期储备中 ${ethDistributionFacts.stellarSelectionEthPercentage}% 的 ETH。`,
        },
        {
          id: 'nft-selection',
          subtitle: 'NFT 星选',
          text: `${protocolFacts.nftStellarSelectionRecipients} 位获配者各获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻与 1 枚 Cosmic Signature NFT。`,
        },
        {
          id: 'anchored-selection',
          subtitle: '锚定 NFT 星选',
          text: `${protocolFacts.anchoredRwlkNftSelectionRecipients} 位 Random Walk NFT 锚定者各获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 表彰铭刻与 1 枚 Cosmic Signature NFT。`,
        },
        {
          id: 'anchor-distribution',
          subtitle: '锚定派发',
          text: `${ethDistributionFacts.anchorDistributionPercentage}% 的 ETH 按已锚定 Cosmic Signature NFT 的数量比例派发。`,
        },
        {
          id: 'public-goods',
          subtitle: '公共物品',
          text: `${ethDistributionFacts.publicGoodsPercentage}% 的 ETH 会转拨给当前公共物品受益方 Protocol Guild。`,
        },
        {
          id: 'compounding',
          subtitle: '滚动储备',
          text: `约 ${protocolFacts.compoundingReservePercentage}% 的周期储备会滚入下一个演绎周期。`,
        },
        {
          id: 'outreach',
          subtitle: '推广储备',
          text: `每个周期会为推广派发与生态贡献者铭刻 ${protocolFacts.outreachReserveCst.toLocaleString()} CST。`,
        },
        {
          id: 'retrieval',
          subtitle: '取回分配',
          text: `部分分配需要通过平台手动取回。周期收官倒计时结束后，签名分配的合资格参与者享有 ${protocolFacts.finalGestureExclusivityHours} 小时的专属收官时间。该窗口结束后，任何人都可完成周期收官；按照智能合约规则，实际收官者将成为周期受益方并获得签名分配。次级 ETH、已附加代币与已附加 NFT 采用另一项取回期限，默认为 ${protocolFacts.secondaryRetrievalTimeoutWeeks} 周；期限结束后，智能合约允许任何人为自己取回仍未取回的分配。你有责任在相应期限届满前取回分配。`,
        },
        {
          id: 'no-guarantee',
          subtitle: '不保证结果',
          text: '参与 Cosmic Signature 不保证产生任何结果。所有落笔均视为最终操作，你可能无法收回落笔价格的全部金额。切勿使用无法承受失去的资金落笔。',
        },
      ],
    },
    {
      id: 'risks',
      title: '风险与免责声明',
      content: [
        {
          id: 'blockchain-risk',
          subtitle: '区块链技术风险',
          text: '你确认知悉区块链技术的固有风险，包括但不限于智能合约漏洞、网络拥堵、燃料费波动、监管变化，以及技术问题可能造成的资金损失。',
        },
        {
          id: 'warranties',
          subtitle: '不作保证',
          text: 'Cosmic Signature 按"现状"提供，不附带任何明示或默示保证。我们不保证平台持续不中断、毫无错误或不含有害组件。',
        },
        {
          id: 'volatility',
          subtitle: '市场波动',
          text: '加密货币与 NFT 市场波动剧烈。ETH、CST 代币及 NFT 的价值可能大幅变化；过往表现并不代表未来结果。',
        },
        {
          id: 'audits',
          subtitle: '智能合约审计',
          text: '我们会尽力保障智能合约安全，但任何审计都无法保证绝对安全。你须自行承担使用本平台的风险。',
        },
      ],
    },
    {
      id: 'prohibited',
      title: '禁止行为',
      content: [
        {
          id: 'intro',
          text: '你同意不得从事以下任何禁止行为：',
        },
        {
          id: 'exploit',
          text: '• 利用程序缺陷、故障或漏洞操纵或破坏协议机制',
        },
        {
          id: 'automation',
          text: '• 使用机器人、脚本或自动化工具与平台交互',
        },
        {
          id: 'collusion',
          text: '• 实施任何形式的市场操纵，或与其他用户串通',
        },
        {
          id: 'security',
          text: '• 试图入侵、逆向工程或破坏平台安全',
        },
        {
          id: 'law',
          text: '• 违反任何适用法律法规',
        },
        {
          id: 'accounts',
          text: '• 创建多个账户以取得不公平优势',
        },
        {
          id: 'malicious',
          text: '• 上传恶意内容或试图发动拒绝服务攻击',
        },
      ],
    },
  ],
  additionalTitle: '其他条款',
  additional: [
    {
      id: 'intellectual-property',
      subtitle: '知识产权',
      text: '仓库根目录 LICENSE 所涵盖的项目自有材料采用 CC0 1.0。第三方依赖、字体、素材及其他第三方材料仍适用各自的许可证，不在该权利放弃范围内；详见 THIRD_PARTY_NOTICES.md。CC0 不放弃商标权或专利权。未采用 CC0 或指定开源许可证的材料仍归各自权利人所有，并受适用的知识产权法律保护。通过协议获得 NFT，代表你拥有相应的特定代币；除非另有明确说明，该所有权不包含底层知识产权。',
    },
    // lexicon-allow-start: 责任限制条款须忠实保留利润损失这一法律概念。
    {
      id: 'liability',
      subtitle: '责任限制',
      text: '在法律允许的最大范围内，Cosmic Signature 及其关联方不对任何间接、附带、特殊、后果性或惩罚性损害承担责任，也不对直接或间接发生的任何利润或营收损失，以及因使用本平台而产生的数据、使用权、商誉或其他无形损失承担责任。',
    },
    // lexicon-allow-end
    {
      id: 'indemnification',
      subtitle: '赔偿',
      text: '对于因你使用本平台、违反本条款或侵害任何第三方权利而产生的任何索赔、损失、损害、责任及费用（包括法律费用），你同意赔偿 Cosmic Signature 及其关联方并使其免受损害。',
    },
    {
      id: 'disputes',
      subtitle: '争议解决',
      text: '因本条款或你使用 Cosmic Signature 而产生的任何争议，应按照美国仲裁协会规则通过具有约束力的仲裁解决。你放弃接受陪审团审判或参与集体诉讼的任何权利。',
    },
    {
      id: 'law',
      subtitle: '适用法律',
      text: '本条款受 Cosmic Signature 运营所在司法管辖区的法律管辖并依其解释，不适用该司法管辖区的法律冲突规则。',
    },
    {
      id: 'severability',
      subtitle: '可分割性',
      text: '若本条款任何规定被认定无效或不可执行，其余规定仍将保持完全效力。',
    },
    {
      id: 'agreement',
      subtitle: '完整协议',
      text: '本条款构成你与 Cosmic Signature 之间关于使用本平台的完整协议，并取代此前的一切协议。',
    },
    {
      id: 'contact',
      subtitle: '联系方式',
      text: '如对本服务条款有任何疑问，请通过官方社区渠道或 GitHub 仓库联系我们。',
    },
  ],
  // lexicon-allow-start: Howey 测试否认文案须明确排除投资属性。
  warning: {
    title: '重要警示',
    text: '参与 Cosmic Signature 涉及财务风险。加密货币与 NFT 市场波动剧烈，你可能无法收回落笔所对应的价值。切勿使用无法承受失去的资金落笔。Cosmic Signature 不是投资产品，不对代币价格或未来表现作任何陈述，也不会以投资名义招揽参与。参与前，请自行研究并审慎考虑自身财务状况。',
  },
  // lexicon-allow-end
  acknowledgment: {
    title: '确认',
    text: '使用 Cosmic Signature，即表示你确认已阅读、理解并同意受本服务条款约束。你同时确认已理解区块链技术、加密货币与 NFT 所涉及的风险。',
  },
} as const satisfies TermsCopy;

export function TermsContentZh() {
  return <TermsContent copy={termsCopyZh} />;
}
