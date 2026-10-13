# 首页 Hero 官方 Trailer

2026-10-13（Asia/Shanghai）。

- 官方来源页：https://annapurnainteractive.com/games/forever-ago ，以及开发商 https://forever-ago.com/ 。两页均嵌入 AeHgQ29sukE。
- 视频：https://www.youtube.com/watch?v=AeHgQ29sukE 。标题 Forever Ago | Launch Trailer；发布账号 Annapurna Interactive。真实Tabbit核验 playabilityStatus=OK、playableInEmbed=true，本站本地嵌入播放后 playerState=1、currentTime>0。
- 仅填写 site-spec/en/home.json 的 hero.video，经母模板 assemble 生成 content/en/home.json 与 .site-build.json。无播放器、Hero组件或CSS改动，继承锁定母模板 ec8eb1fa0a0ceb3749b47c91b661ea713db2effc。
- 桌面1440px：视频位于文案右栏，与文案顶边对齐，552×310.5px。390px和320px手机：视频排在文案下方；保留母模板200px最小高度。该规则使视频宽度约355.55px，在320px极窄屏会由既有Hero overflow:hidden裁切；本次未覆盖母模板尺寸规则。
- 内容与主题校验、lint、typecheck、静态生产构建通过；13项既有视频单元测试和7项首页轮播浏览器测试通过。
- 主目录存在并行改版的未提交改动；本次以 e1fec18 为基准隔离执行，未提交或部署这些改版。
