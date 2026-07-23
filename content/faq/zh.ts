import { cstRewardFacts, isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import type { FAQContent } from './types';

/**
 * 中文内容仅翻译可见文案。所有 ID 与 hashAnchor 都与英文保持一致，
 * 以免破坏既有外部链接。
 */
export const faqContentZh = {
  categories: [
    {
      id: 'getting-started',
      title: '开始使用',
      description: '了解 Cosmic Signature 的基础知识与参与方式',
      icon: 'rocket',
      items: [
        {
          id: 'what-is-cosmic-signature',
          question: 'Cosmic Signature 是什么？',
          answer:
            'Cosmic Signature 是 Arbitrum 上的程序化链上艺术协议。参与者在演绎周期中落笔，每一笔都会塑造这一周期最终的签名。周期收官后，协议将储备分配至十余条轨道，其中包括支持 170 多位以太坊核心贡献者的 Protocol Guild。',
        },
        {
          id: 'is-cosmic-signature-related-to-biology',
          question: 'Cosmic Signature 与生物学领域的 COSMIC 数据库有关吗？',
          answer:
            '没有关系。Cosmic Signature 与 COSMIC 癌症突变数据库及生物学中的 COSMIC 突变特征均无关联。它是链上艺术协议及应用，聚焦由确定性三体运动生成的 NFT 艺术。',
        },
        {
          id: 'how-does-the-bidding-game-work',
          question: '演绎周期如何运作？',
          answer: `每个周期都以首笔落笔的 ETH 校准窗口开启。首笔落笔会启动周期收官倒计时，当前默认约为 24 小时。此后每笔 ETH 或 CST 落笔都会把当前时间增量加到链上收官时间；该增量初始为 1 小时，并在每个周期收官后增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%。倒计时结束后，收官之笔的参与者享有 ${protocolFacts.finalGestureExclusivityHours} 小时的专属收官窗口，可完成周期收官并取回签名分配；在周期实际收官前，仍可继续落笔。`,
        },
        {
          id: 'what-type-of-gestures-are-available',
          question: '可以用哪些方式落笔？',
          answer:
            '落笔可使用 ETH 或 CST 代币（ERC-20）。每个周期的首笔落笔必须使用 ETH；之后可以自由交替使用 ETH 与 CST。ETH 落笔还可附加一枚 Random Walk NFT，使 ETH 落笔价格降低 50%。Cosmic Signature NFT（ERC-721）用于分配与锚定，不能用来支付落笔。CST 落笔使用独立的校准窗口：窗口运行期间，CST 落笔价格会逐步下降；每笔 ETH 或 CST 落笔又会改变窗口本身的时长。',
        },
        {
          id: 'can-i-participate-without-nfts',
          question: '没有 NFT 也能参与吗？',
          answer:
            '可以。任何人都能在 Cosmic Signature 的演绎周期中落笔。若拥有尚未使用的 Random Walk NFT，也可将其附加至一笔 ETH 落笔，使落笔价格降低 50%。',
        },
        {
          id: 'how-can-i-get-involved',
          question: '有哪些参与方式？',
          answer:
            '你可以在演绎周期中落笔，也可以将自己项目的 NFT 贡献给协议，供参与者随落笔附加。加入 Discord，即可认识其他参与者。',
        },
        {
          id: 'how-long-does-each-round-last',
          question: '每个演绎周期会持续多久？',
          answer: `首笔 ETH 落笔会开启周期，并将收官倒计时设为当前时间增量的约 24 倍（协议上线时约为 1 天）。此后每笔落笔都会加入当前时间增量；该增量初始恰为 1 小时，并在每个周期收官后增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%。因此，只要在收官前持续有人落笔，一个周期就可能远超 1 天。`,
        },
        {
          id: 'can-i-place-multiple-gestures',
          question: '一个周期内可以多次落笔吗？',
          answer:
            '可以。每笔落笔都会增加周期末星选的资格次数，更新你在坚守冠军与时之勇士轨道中的坚守时段，并塑造不断演变的签名；同时还可能向钱包铭刻参与 CST。参与 CST 的数量并不固定，而取决于距上一笔落笔经过了多久：间隔越长，铭刻量越大；连续快速落笔的铭刻量则较少。',
        },
      ],
    },
    {
      id: 'allocations-and-rewards',
      title: '分配与派发',
      description: '了解周期收官后参与者可能获得的资产',
      icon: 'trophy',
      items: [
        {
          id: 'what-is-the-main-allocation',
          question: '什么是签名分配？',
          answer:
            '签名分配由周期收官之笔的参与者获得，其中包括 1 枚 Cosmic Signature NFT、1,000 CST 的表彰铭刻、周期储备中 25% 的 ETH，以及该周期内随参与者落笔附加的所有代币或 NFT。',
          hashAnchor: 'main-allocation',
        },
        {
          id: 'what-rewards-per-bid',
          question: '每次落笔会带来什么？',
          answer: `每笔落笔都会记录 1 次周期末星选资格，更新坚守窗口对坚守冠军和时之勇士轨道的贡献，并可能铭刻参与 CST。参与 CST 按${isV3Mechanics ? '线性' : '平方根'}公式计算：${cstRewardFacts.formula}。简单来说，距上一笔落笔越久，数量越多${isV3Mechanics ? '，且按恒定速率增长' : '，但增长速度会逐渐放缓'}。极短间隔可能得到 0 CST；较长的静默期则可能产生更多 CST 铭刻。`,
        },
        {
          id: 'how-does-the-stellarSelection-work',
          question: '星选如何运作？',
          answer: `每笔落笔都会记录 1 次星选资格。每个周期结束时，智能合约会从资格池中进行程序化随机选择：${protocolFacts.ethStellarSelectionRecipients} 次选择共同分得周期储备中 ${protocolFacts.stellarSelectionEthPercentage}% 的 ETH；${protocolFacts.nftStellarSelectionRecipients} 次选择各获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 与 1 枚 Cosmic Signature NFT；已锚定 Random Walk NFT 中另有 ${protocolFacts.anchoredRwlkNftSelectionRecipients} 次选择，也各获得 ${protocolFacts.specialAllocationCst.toLocaleString()} CST 与 1 枚 Cosmic Signature NFT。选择采用放回方式，同一地址在同一周期内可能被选中多次。落笔次数越多，被选中的频次也会增加。`,
        },
        {
          id: 'how-random-selection-works',
          question: '程序化随机选择是怎样完成的？',
          answer:
            '星选在周期收官时使用链上随机源，包括 Arbitrum 提供的区块上下文与备用熵源。参与者星选按资格加权：每笔落笔增加 1 次资格，因此落笔越多，被选中的频次越高。锚定 NFT 星选则是独立机制，依据已锚定 Random Walk NFT 的资格，而不是参与者落笔资格池。',
        },
        {
          id: 'how-do-i-claim-my-allocation',
          question: '成为获配者后，如何取回分配？',
          answer: `获配者可通过应用与协议合约取回分配。周期收官倒计时结束后，收官之笔参与者享有 ${protocolFacts.finalGestureExclusivityHours} 小时的专属时间，可完成周期收官并取回签名分配。此后进入公开收官窗口：任何人都可发起收官交易，智能合约会把实际完成收官的人视为周期受益方——收官者将获得整份签名分配，包括 ETH 份额、${protocolFacts.specialAllocationCst.toLocaleString()} CST 铭刻、Cosmic Signature NFT，以及对已附加资产的优先权。次级 ETH、已附加代币与已附加 NFT 会由分配钱包托管，并采用另一项取回超时设置，当前默认为 ${protocolFacts.secondaryRetrievalTimeoutWeeks} 周；超时后，合约允许任何人为自己取回仍未取回的分配。请及时处理。`,
        },
        {
          id: 'how-does-anchoring-work',
          question: '锚定如何运作？',
          answer: `Cosmic Signature NFT 可锚定至协议，以获得 ETH 锚定派发：每个已收官周期会划出周期储备的 ${protocolFacts.anchorDistributionPercentage}%，按当时已锚定的 Cosmic Signature NFT 数量平均分配；累积的 ETH 会在解锚时派发。Random Walk NFT 也可以锚定，但只用于取得锚定 NFT 星选资格——被选中的锚定者会获得 CST 与 Cosmic Signature NFT，而不是 ETH。还需注意两条规则：每枚 NFT 永远只能锚定一次（解锚后不可再次锚定）；若周期收官时没有任何 Cosmic Signature NFT 处于锚定状态，该周期的 ${protocolFacts.anchorDistributionPercentage}% 会留在周期储备中。CST（ERC-20）不能锚定。可从账户菜单进入"我的锚定"页面管理锚定。`,
        },
        {
          id: 'what-are-marketing-rewards',
          question: '什么是推广储备？',
          answer: `帮助推广协议可获得 CST 代币（ERC-20）。推广储备每个周期铭刻 ${protocolFacts.outreachReserveCst.toLocaleString()} CST，并将其发放给生态贡献者。具体方式可在 Discord 联系推广托管人。`,
        },
        {
          id: 'how-many-nfts-minted',
          question: '每个周期会铭刻多少枚 Cosmic Signature NFT？',
          answer: `绝大多数周期会铭刻 ${protocolFacts.typicalNftsPerCycle} 枚 Cosmic Signature NFT：签名分配获配者、CST 收官之笔获配者、坚守冠军与时之勇士各 1 枚；参与者 NFT 星选获配者共 ${protocolFacts.nftStellarSelectionRecipients} 枚；通过锚定 NFT 星选选出的 Random Walk NFT 锚定者共 ${protocolFacts.anchoredRwlkNftSelectionRecipients} 枚。这 ${protocolFacts.typicalNftsPerCycle} 份 NFT 分配还会各附带 ${protocolFacts.specialAllocationCst.toLocaleString()} CST。若某周期没有 CST 落笔或没有已锚定的 Random Walk NFT，对应的铭刻便会在该周期跳过。`,
        },
        {
          id: 'what-happens-to-remaining-eth',
          question: '周期储备中剩余的 ETH 会怎样处理？',
          answer:
            '约一半的周期储备会作为滚动储备进入下一个演绎周期，提高下一周期的起始余额。协议让储备滚动累积，而非将其抽走。',
        },
        {
          id: 'what-happens-to-attached-assets',
          question: '随落笔附加的代币或 NFT 会怎样处理？',
          answer: `随落笔附加的 ERC-20 代币或 ERC-721 NFT 由分配钱包合约托管，不会进入 ETH 周期储备。周期收官后，周期受益方（通常为收官之笔参与者）享有优先取回权。若超出次级取回期限仍无人取回，目前默认期限为 ${protocolFacts.secondaryRetrievalTimeoutWeeks} 周，合约将允许任何人为自己取回这些资产。`,
        },
        {
          id: 'who-receives-10-percent',
          question: '周期储备中的公共物品分配会发给谁？',
          answer:
            '周期收官时，周期储备的 7% 会转入公共物品金库；此后任何人都可将金库余额转给已配置的公共物品受益方。当前受益方为 Protocol Guild，这是支持 170 多位以太坊核心贡献者的集体资助机制。目前，受益方地址由协议所有者设置；待协议所有权交由宇宙议会后，设计目标是由议会决定受益方。',
        },
      ],
    },
    {
      id: 'game-mechanics',
      title: '周期机制',
      description: '深入了解落笔时机与协议规则',
      icon: 'cycle',
      items: [
        {
          id: 'how-does-price-increase',
          question: '一个周期内，落笔价格如何变化？',
          answer:
            'ETH 与 CST 落笔价格各自遵循独立的链上路径。ETH 落笔价格先经过 ETH 校准窗口，此后每笔 ETH 落笔都会使价格阶梯式上调。CST 落笔价格则在当前 CST 校准窗口中逐步下降。CST 窗口并非固定：ETH 落笔会使其略微缩短，CST 落笔会使其略微延长，因此价格路径会随两类参与的比例而变化。',
        },
        {
          id: 'what-is-dutch-auction',
          question: '什么是校准窗口？',
          answer: `校准窗口是价格发现时段，落笔价格会在已知时长内从校准上限线性下降。ETH 与 CST 使用彼此独立、下限不同的窗口：ETH 落笔价格最低约降至上限的 1/${protocolFacts.ethCalibrationFloorDivisor}；CST 落笔价格则可一路降至 ${protocolFacts.cstCalibrationFloorCst}，若窗口完整走完，便可能以 0 CST 落笔。CST 校准窗口目前以 ${protocolFacts.initialCstCalibrationWindowHours} 小时为初始参考，但其时长存储在链上，并会在每笔落笔后改变：每笔 CST 落笔会使窗口增加约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%，每笔 ETH 落笔会使其减少约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%。`,
        },
        {
          id: 'how-is-participation-cst-calculated',
          question: '参与 CST 如何计算？',
          answer: isV3Mechanics
            ? `参与 CST 随距上一笔落笔的时间线性累积：${cstRewardFacts.formula}。按协议上线时恰为 1 小时的时间增量计算，速率约为每分钟 ${protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch} CST，示例约为：${cstRewardFacts.examples.map((example) => `${example.elapsed} 后为 ${example.cst} CST`).join('、')}。每个周期收官后，时间增量会增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%，因此实时数量会随时间逐渐略低于这些示例。落笔实际成交时，应以应用中的实时预览和合约计算为准。`
            : `参与 CST 按距上一笔落笔的时间，以平方根公式计算：${cstRewardFacts.formula}。采用平方根，是为了让较长的静默期获得更多 CST，同时避免数量永远线性增长。按协议上线时恰为 1 小时的时间增量计算，示例约为：${cstRewardFacts.examples.map((example) => `${example.elapsed} 后为 ${example.cst} CST`).join('、')}。每个周期收官后，时间增量会增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%，因此实时数量会随时间逐渐略低于这些示例。落笔实际成交时，应以应用中的实时预览和合约计算为准。`,
        },
        {
          id: 'why-minimum-cst-reward-protection',
          question: '什么是最低 CST 铭刻保护？',
          answer:
            '提交落笔前，应用会预览预计获得的参与 CST，并把你愿意接受的最低 CST 数量发送给合约。若另一笔落笔抢先成交，预计数量可能改变；如果最终铭刻量低于你设定的下限，最低 CST 铭刻保护可以阻止交易。你也可以选择接受任意数量，包括 0 CST；此时只要价格检查通过，落笔便可继续。',
        },
        {
          id: 'how-cst-calibration-window-changes',
          question: '每笔落笔如何改变 CST 校准窗口？',
          answer: `每笔 ETH 或 CST 落笔都会更新链上保存的 CST 校准窗口。CST 落笔会把窗口延长"当前时长 / ${protocolFacts.cstCalibrationWindowChangeDivisor}"，整数截断前约为 +${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%；ETH 落笔会把窗口缩短约"当前时长 / ${protocolFacts.cstCalibrationWindowChangeDivisor + 1}"，约为 -${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%。窗口越短，CST 落笔价格下降越快；窗口越长，下降越慢。`,
        },
        {
          id: 'what-is-open-finalization-window',
          question: '什么是公开收官窗口？',
          answer: `周期收官倒计时结束后，收官之笔参与者享有 ${protocolFacts.finalGestureExclusivityHours} 小时的专属收官时间。若未在该窗口内完成收官，任何人都可发起收官交易，智能合约会把实际收官者设为周期受益方。收官者将获得完整的签名分配，包括 ETH 份额、${protocolFacts.specialAllocationCst.toLocaleString()} CST、Cosmic Signature NFT，以及对已附加资产的优先权。因此，收官之笔参与者应在专属窗口结束前完成收官。即使该参与者离开，公开收官机制也能让协议继续运行。`,
        },
        {
          id: 'what-is-endurance-champion',
          question: '什么是坚守冠军？',
          answer:
            '一个周期内，保持"最近一笔落笔者"身份时间最长的参与者，即下一笔落笔出现前拥有最长连续间隔的人，会成为坚守冠军。周期收官时，坚守冠军将获得 1,000 CST 的表彰铭刻与 1 枚 Cosmic Signature NFT。',
          hashAnchor: 'endurance-champion',
        },
        {
          id: 'what-is-final-cst-gesture',
          question: '什么是 CST 收官之笔？',
          answer:
            'CST 收官之笔是一个周期中最后一笔使用 CST 完成的落笔。周期收官时，完成该笔落笔的参与者将获得 1,000 CST 的表彰铭刻与 1 枚 Cosmic Signature NFT。',
          hashAnchor: 'final-cst-gesture',
        },
        {
          id: 'what-is-chrono-warrior',
          question: '什么是时之勇士？',
          answer: `时之勇士是在坚守冠军位置上连续保持最久的参与者。坚守冠军对应保持"最近一笔落笔者"身份最久的人，时之勇士则对应保持坚守冠军身份最久的人。周期收官时，时之勇士将获得周期储备中 ${protocolFacts.chronoWarriorEthPercentage}% 的 ETH、${protocolFacts.specialAllocationCst.toLocaleString()} CST 与 1 枚 Cosmic Signature NFT。`,
          hashAnchor: 'chrono-warrior',
        },
        {
          id: 'does-time-per-bid-stay-same',
          question: '每笔落笔增加的时间始终相同吗？',
          answer: `不会。协议上线时，每笔落笔增加的时间恰为 1 小时；此后每当一个周期收官，增量都会增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%。由于增量变大也会拉长每个周期，按日历时间看，这种增长会自然放缓。`,
        },
        {
          id: 'why-time-per-bid-increases',
          question: '为什么每笔落笔增加的时间会逐步增长？',
          answer:
            '这一机制会限制 Cosmic Signature NFT 的长期铭刻速度。周期越慢，单位时间内进入流通的新 NFT 越少，从而维持稀缺性。',
        },
        {
          id: 'how-time-increase-affects-game',
          question: '落笔时间增量上升会怎样影响协议？',
          answer:
            '随着每笔落笔增加的时间变长，周期的平均持续时间也会延长。这一变化循序渐进，既保持平稳的参与体验，也限制长期范围内 Cosmic Signature NFT 的总供应增长。',
        },
        {
          id: 'what-if-two-gestures-same-time',
          question: '两笔落笔同时提交会怎样？',
          answer:
            'Arbitrum 交易按照排序器纳入区块的顺序处理。若两笔落笔在同一时刻到达，先获确认的一笔为有效落笔。',
        },
        {
          id: 'is-there-game-theory',
          question: '参与 Cosmic Signature 是否需要策略？',
          answer:
            '需要。落笔时机、频率和方式（ETH、CST 或附加 Random Walk NFT）都会影响各条分配轨道的结果。协议机制与参与者之间的互动允许多种策略在不同轨道上发挥作用。',
        },
      ],
    },
    {
      id: 'tokens-and-nfts',
      title: '代币与 Cosmic Signature',
      description: '了解 CST、链上艺术与数字资产',
      icon: 'gem',
      items: [
        {
          id: 'what-are-cst-and-dao',
          question: 'CST 代币与宇宙议会是什么？',
          answer:
            '每笔落笔都可能铭刻 CST 代币；CST 用于表达宇宙议会中的协调权重。议会在链上协调协议：CST 持有者可以提交协调提案，并表达支持或反对。要启用权重，需先把 CST 委托给自己或其他地址。待合约所有权交由议会后，议会按设计将管理协议参数，包括决定哪个公共物品受益方获得 7% 的分配；目前这些设置仍由协议所有者管理。',
        },
        {
          id: 'what-can-i-do-with-cst',
          question: 'CST 代币有哪些用途？',
          answer:
            'CST 可通过 CST 校准窗口替代 ETH 用于落笔；落笔消耗的 CST 会被销毁（永久移出供应量），而不会汇入资金池。落笔也可能铭刻参与 CST，但数量会随距上一笔落笔的时间动态变化。完成委托后（可以委托给自己），CST 还可用于表达宇宙议会中的协调权重。',
        },
        {
          id: 'what-makes-nfts-unique',
          question: 'Cosmic Signature NFT 有何独特之处？',
          answer:
            'Cosmic Signature NFT 完全位于链上，并可持续独立生成。每枚 NFT 都铭刻了智能合约随机生成并保存的种子；图像与视频由开源 Rust 流水线根据该种子渲染。种子决定三个天体的初始条件，从而为每枚 NFT 产生独一无二的混沌轨迹。',
        },
        {
          id: 'how-are-nft-images-created',
          question: 'NFT 图像是怎样生成的？',
          answer:
            '每枚 Cosmic Signature NFT 都以牛顿引力下的三体问题为主题。流水线模拟三个天体在引力作用下的运动，并在 380 至 700 纳米范围内以 64 个波长区间对轨迹进行光谱渲染，为每枚 NFT 生成独特的混沌图案。',
        },
        {
          id: 'significance-of-random-seed',
          question: '为什么每枚 NFT 都由链上种子生成？',
          answer:
            '基于种子的流水线可确保作品长期可复现。有些 NFT 项目的图像依赖中心化服务器，而每枚 Cosmic Signature NFT 的种子都存储在 Arbitrum 上。任何人都能随时使用开源 Rust 流水线独立重新生成 NFT 图像和视频，逐像素与原作一致。',
        },
        {
          id: 'is-nft-supply-limited',
          question: 'Cosmic Signature NFT 的数量有限吗？',
          answer: `从实际发行节奏看，是的。每个周期收官后，每笔落笔增加的时间都会增长 ${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%，使周期逐渐变长、NFT 铭刻速度逐步放缓。合约并未设置硬性供应上限，但不断放慢的周期节奏会让 Cosmic Signature NFT 随时间日益稀缺。`,
        },
        {
          id: 'impact-of-limiting-nfts',
          question: 'NFT 供应增速受限会带来什么影响？',
          answer:
            '不断增长的落笔时间增量与逐步放缓的铭刻速度会维持稀缺性。每一枚新 Cosmic Signature NFT，都是协议累计历史中愈发少见的一段切片。',
        },
        {
          id: 'connection-with-randomwalknft',
          question: 'Cosmic Signature 与 Random Walk NFT 有什么关联？',
          answer:
            'Random Walk NFT 持有者可将一枚尚未使用的代币附加至一笔 ETH 落笔，使 ETH 落笔价格降低 50%。Random Walk NFT 锚定者还会在每个周期取得锚定 NFT 星选资格。',
        },
        {
          id: 'how-to-trade-nfts-tokens',
          question: '如何交易或出售 Cosmic Signature NFT 与 CST？',
          answer:
            'Cosmic Signature NFT 可在 Axiom Zero（axiomzero.market）交易；这是专为 Cosmic Signature 与 Random Walk NFT 打造的零手续费 NFT 市场。CST 则可在 Arbitrum 上的 Uniswap 交易。二者分别是标准 ERC-721 与 ERC-20 资产，因此任何支持相应标准的 Arbitrum 市场或交易平台也可使用，包括 OpenSea。',
        },
        {
          id: 'where-to-buy-cosmic-signature-nfts',
          question: '在哪里可以买卖 Cosmic Signature NFT？',
          answer:
            '主要平台是 Axiom Zero（https://www.axiomzero.market/cosmic-signature），这是 Arbitrum 上面向公平启动生成艺术的零手续费 NFT 市场。挂单与成交均直接在链上结算，出售方会收到全部成交金额；每个代币页面还会实时读取锚定合约并显示 NFT 的锚定状态。未曾锚定的代币会为下一位持有者保留一次锚定机会。',
        },
        {
          id: 'cosmic-signature-prediction-market',
          question: 'Cosmic Signature 有预测市场吗？',
          answer:
            '有。Chaos Zero（https://chaoszero.com）是专为 Cosmic Signature 构建的预测市场。每个演绎周期都会提出一个问题：本周期收官时的落笔次数是否会超过上一周期？所有头寸以 CST 计价，并按机制完全抵押；市场依据公开的链上落笔次数结算，不设所有者或管理密钥。',
        },
        {
          id: 'participate-dao-without-bidding',
          question: '不落笔也能参与宇宙议会吗？',
          answer:
            '可以。你可以在受支持的平台取得 CST，委托给自己或其他地址后，即可在宇宙议会中表达协调权重。落笔仍是铭刻新 CST 的主要方式。',
        },
        {
          id: 'donate-nfts-to-game',
          question: '其他 NFT 项目如何向某个周期贡献代币？',
          answer:
            '项目方可在落笔界面的"高级"面板中附加 ERC-721 或 ERC-20 代币。填写合约地址、代币 ID 或数量后提交落笔。附加的代币会由分配钱包托管，并在周期收官后流向签名分配获配者。',
        },
      ],
    },
    {
      id: 'arbitrum-and-technical',
      title: 'Arbitrum 与技术',
      description: '网络设置、钱包与技术细节',
      icon: 'layers',
      items: [
        {
          id: 'what-is-arbitrum',
          question: 'Arbitrum 是什么？Cosmic Signature 为什么部署在这里？',
          answer:
            'Arbitrum 是以太坊 Layer 2 汇总网络，可加快交易并降低费用。Cosmic Signature 部署在 Arbitrum 上，既能把燃料费降至不足 1 美分并更快确认交易，又能保留以太坊的安全保障。',
        },
        {
          id: 'why-arbitrum-not-ethereum',
          question: '为什么选择 Arbitrum，而不是以太坊主网？',
          answer:
            '越来越多的链上活动正在迁移至 Layer 2。Arbitrum 大幅降低燃料费，同时沿用以太坊 Layer 1 的安全模型，非常适合需要频繁落笔的 Cosmic Signature 协议。',
        },
        {
          id: 'arbitrum-security',
          question: 'Arbitrum 为什么能获得以太坊 Layer 1 级别的安全性？',
          answer:
            'Arbitrum 是汇总网络，而不是侧链。每批交易都会发布回以太坊主网，因此 Arbitrum 的安全性锚定在以太坊本身：数据与争议解决均位于 Layer 1。',
        },
        {
          id: 'how-to-get-eth-on-arbitrum',
          question: '如何在 Arbitrum 上取得 ETH？',
          answer:
            '可使用 Arbitrum 官方跨链桥或其他受支持的跨链桥，把 ETH 从以太坊主网转入 Arbitrum。ETH 会锁定在以太坊上，并在 Arbitrum 上生成等额可用余额。跨链过程需要支付以太坊 Layer 1 燃料费。',
        },
        {
          id: 'existing-wallet-on-arbitrum',
          question: '现有的以太坊钱包能在 Arbitrum 上使用吗？',
          answer:
            '可以。同一组私钥可在两个网络上签署交易，只需把 Arbitrum 添加到钱包的网络列表即可。',
        },
        {
          id: 'view-tokens-on-arbitrum',
          question: '如何查看 Arbitrum 上的 CST 与 Cosmic Signature NFT？',
          answer:
            '可以直接在 Cosmic Signature 网站查看，也可手动把合约地址添加至钱包。所有合约地址都公布在"合约"页面与社区 Discord 中。',
        },
        {
          id: 'trade-on-arbitrum',
          question: '可以在 Arbitrum 上交易 Cosmic Signature NFT 与 CST 吗？',
          answer:
            '可以。Cosmic Signature NFT 可在该系列的零手续费市场 Axiom Zero 交易，CST 可在 Uniswap 交易。二者分别是 Arbitrum 上的标准 ERC-721 与 ERC-20 资产，因此任何支持这些标准的市场或交易平台也可使用。交易前请务必核对合约地址。',
        },
        {
          id: 'verify-bid-success',
          question: '如何确认落笔已成功提交？',
          answer:
            '成功的落笔会在 Arbitrum 上得到确认，并显示在 Arbitrum 区块浏览器 Arbiscan 中。将交易哈希粘贴至浏览器，即可验证这笔落笔。',
        },
        {
          id: 'game-security',
          question: '协议如何保障安全？',
          answer:
            'Cosmic Signature 公开合约地址、源代码资源与验证背景，便于社区独立检查协议行为。正式审计报告与验证说明发布或更新后，应以"审计"页面所列内容为准。',
        },
        {
          id: 'fees-involved',
          question: '参与需要支付哪些费用？',
          answer:
            '除落笔价格外，每笔交易还需支付 Arbitrum 网络燃料费。燃料费会随网络状况波动，不由 Cosmic Signature 控制。',
        },
      ],
    },
    {
      id: 'trust-and-governance',
      title: '信任与协调',
      description: '了解透明度、团队权限与开源愿景',
      icon: 'shield',
      items: [
        {
          id: 'team-controls',
          question: '团队对协议拥有哪些控制权限？',
          answer:
            '初期，团队可以调整部分协议参数，例如落笔时间增量或分配轨道比例。这些权限通过智能合约的 Ownable 模式实现，并限定在周期间窗口：下一个周期一旦启用（启用发生在首笔落笔之前），核心协议参数便会锁定，直至该周期收官。锁定期间仍保留少量范围更窄的权限：所有者可把周期启用推迟至首笔落笔到来，也可随时调整下一周期前的延迟，并随时管理外围合约（公共物品金库受益方、NFT 元数据 URI 与分配钱包取回期限）。协议合约还可由所有者通过 UUPS 升级，但只能在周期间进行；当前部署的是已公开验证的 V2 实现。',
        },
        {
          id: 'will-team-always-have-control',
          question: '团队会一直控制协议参数吗？',
          answer:
            '不会。协议稳定后，所有权将移交宇宙议会。此后，参数只能通过达到协调法定权重的协议协调提案变更。',
        },
        {
          id: 'what-is-renounce-ownership',
          question: '"放弃所有权"是什么意思？',
          answer:
            '放弃所有权是 Ownable 合约的一项函数，会永久把控制权从部署者地址移走。调用后，任何特权角色都无法再修改合约参数。',
        },
        {
          id: 'why-renounce-ownership',
          question: '团队为什么会放弃所有权？',
          answer:
            '目标是让协议保持公平与去中心化。放弃所有权可确保协议上线后，规则不能被任意更改，从而增强参与者对协议的信任与可预期性。',
        },
        {
          id: 'how-team-profits',
          question: 'Cosmic Signature 团队如何从协议中获得价值？',
          answer:
            '参与者落笔所支付的 ETH 不会进入任何团队钱包。所有 ETH 都汇入周期储备，并按各条分配轨道发放。团队通过持有 Random Walk NFT 与协议间接保持利益一致；协议成功可能提升这些 NFT 的文化价值。团队的主要动力是好奇心、创造力，以及为开源公共物品作出贡献。',
        },
        {
          id: 'why-was-cs-created',
          question: '为什么要创建 Cosmic Signature？',
          answer:
            'Cosmic Signature 源于对混沌理论与三体问题无解析解特性的着迷。由链上种子生成独特而确定的艺术，既引人入胜，也契合支持公共物品的协议理念。',
        },
        {
          id: 'what-if-team-disappears',
          question: '如果团队不再维护项目，会怎样？',
          answer:
            '协议按可持续独立运行的目标设计。种子存储在链上，任何人都可以使用开源 Rust 流水线重新生成 NFT 图像与视频。无论团队状态如何，每枚 Cosmic Signature NFT 都能持续访问。',
        },
        {
          id: 'can-create-competing-site',
          question: '可以复刻代码并搭建自己的网站吗？',
          answer:
            '当然可以。项目自有的合约、着色器、渲染器、页面与文档均采用 CC0 1.0，不保留任何权利。第三方依赖、字体与素材仍适用各自的许可证；详见 THIRD_PARTY_NOTICES.md。',
        },
        {
          id: 'donate-to-pot',
          question: '不落笔也能向周期储备贡献 ETH 吗？',
          answer:
            '可以。协议合约提供独立于落笔的专用贡献函数，可接收 ETH，也可附加备注并显示在周期贡献列表中。请使用应用内的贡献流程，不要直接从钱包向协议地址转账：直接发送至协议地址的 ETH 会被处理为 ETH 落笔，而不是贡献。详情可通过 Discord 咨询。',
        },
        {
          id: 'get-help',
          question: '遇到问题时，如何获得帮助？',
          answer:
            '可通过 Discord、X / Twitter，以及"联系方式"页面所列的支持邮箱联系社区与支持团队。',
        },
        {
          id: 'stay-updated',
          question: '如何关注 Cosmic Signature 的最新动态？',
          answer: '关注官方社交媒体并加入 Discord 社区，即可获取最新公告、协议协调提案与周期回顾。',
        },
      ],
    },
  ],
  // lexicon-allow-start — 既有公开 URL 片段不可变更。
  popularQuestionIds: [
    'what-is-cosmic-signature',
    'what-is-the-main-allocation',
    'how-does-the-stellarSelection-work',
    'how-does-anchoring-work',
  ],
  // lexicon-allow-end
} as const satisfies FAQContent;
