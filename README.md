<div align="center">
  <img width="1200" height="475" alt="宣坨坨" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 宣坨坨 · 山西柳林扑克

  山西柳林传统三人扑克玩法的 Web 实现。

  [![CI](https://github.com/mxx1111/xuantuotuoV2/actions/workflows/ci.yml/badge.svg)](https://github.com/mxx1111/xuantuotuoV2/actions/workflows/ci.yml)
  ![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)

  **[在线体验](https://mxx1111.github.io/xuantuotuoV2/)**
</div>

## 项目简介

宣坨坨是一种流传于山西柳林的三人策略牌类游戏。本项目使用 24 张牌，还原单张、对子、三张、抢收牌、加倍和“扣了”等特色规则，并提供浏览器内的 AI 对局体验。

## 当前功能

- 三人牌局：玩家可添加两名 AI 后开始游戏
- 完整流程：洗牌、发牌、博弈、出牌、收牌和结算
- 规则判断：单张、对子、三张和特殊组合的牌力计算
- AI 决策：自动完成抢牌、加倍、出牌和“扣了”响应
- 对局体验：出牌提示、回合记录、音效与响应式界面
- 房间原型：已包含 PeerJS 房间号、邀请链接和状态同步代码

> 联机状态：当前“加入房间”入口仍是开发中的占位实现。单机 AI 对局可正常使用，P2P 联机暂不建议作为稳定功能使用。

## 快速开始

### 环境要求

- Node.js 20.19+ 或 22.12+
- npm

### 本地运行

```bash
git clone https://github.com/mxx1111/xuantuotuoV2.git
cd xuantuotuoV2
npm ci
npm run dev
```

打开终端显示的本地地址，在首页选择“开设牌局”，为左右席位添加 AI 后即可开始。

### 生产构建

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到支持静态站点的服务。若继续开发 PeerJS 联机功能，生产环境需要使用 HTTPS。

## 核心规则

- 牌组共 24 张：红黑卒、马、相、尔、曲，以及大王和小王
- 每名玩家起手 8 张牌
- 支持单张、特定对子和特定三张组合
- 跟牌必须数量一致且牌力严格大于当前最大牌，否则扣牌
- 发牌后可选择加倍或抢收牌；抢收牌会改变先手与结算倍率
- 收回 9 / 15 / 18 张牌分别对应“刚够 / 五了 / 此了”

页面内的“查看游戏规则”包含更完整的玩法说明。

## 项目结构

```text
App.tsx                 主界面、状态机、AI 调度和联机原型
gameLogic.ts           牌型、牌力、合法出牌、AI 与结算逻辑
constants.tsx          24 张牌的定义和常量
types.ts               游戏状态、牌面和网络消息类型
components/PlayingCard.tsx
                        扑克牌渲染组件
```

## 技术栈

- React 19 + TypeScript
- Vite 7
- Tailwind CSS（CDN）
- PeerJS / WebRTC（联机原型）
- Web Audio API（合成音效）

## 开发状态

项目目前以玩法还原和单机体验为主，尚未配置自动化游戏逻辑测试。提交规则修改时，建议至少手动验证：

1. 添加两名 AI 并完成一局游戏
2. 检查抢牌、加倍和“扣了”阶段切换
3. 检查单张、对子、三张以及无法跟牌时的扣牌逻辑
4. 在桌面端和移动端宽度下检查界面

## 许可证

当前仓库尚未声明开源许可证。如需复制、分发或用于其他项目，请先联系仓库作者。
