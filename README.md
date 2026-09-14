# MZ · WARDOGS

手机优先的中英双语 WARDOGS 地图与距离工具。原生 HTML / CSS / JavaScript，无框架、构建步骤或运行时依赖。

## 本地运行

```sh
python -m http.server 8000 --bind 127.0.0.1
# Open http://127.0.0.1:8000
node test.mjs
```

## 使用

- 手机：结果 → 地图与武器 → 地图 → 目标 / 自己坐标。桌面坐标并排，目标在前。
- 浏览：鼠标拖动 / 单指拖动、滚轮 / 双指缩放；放置：固定地图，只点选目标。
- 自己的位置只从输入框或已收藏坐标载入，不接受地图点选。
- 独立锁定保护输入、清空与载入；自己的锁不会影响目标。换图保留各地图独立状态。
- 坐标使用游戏 X/Y：X 向东增加，Y 向北增加，0.01 = 1 m。支持小数点 / 小数逗号，最多两位小数；越界不截断、不用于计算。
- 平面距离以米显示；方位使用游戏 HUD 的整数角度 + 方向字母，如 `253 W`。北 0，东 90，南 180，西 270。同一点不显示虚假方位。
- 射程内绿色，过近 / 超射程红色，同时显示文字。实线最大射程圈、虚线最小射程圈以自己为中心。
- 「展开地图」收起计算与输入，保留位置与缩放；仍可选择地图。
- 收藏使用 localStorage（比 cookie 更适合不需要服务器的本地数据），按地图分类；可以命名、载入自己 / 目标、删除和限时撤销。清除网站数据会清除收藏。
- 键盘：地图聚焦后方向键平移，+/− 缩放；放置模式下 Enter 放在中心。原生对话框支持 Escape 关闭。

## 数据与限制

2026-09-14 核对 [原站](https://wardogs-artillery.com/) 与其 [公开代码](https://github.com/apollyon-sys/wardogs-calculator)，commit `ef7cf2d8cb637532b1595b634b87469be6f507b4`。原站实际上已有单独的移动端，但保留了地图工具、团队协作、弹道等大量功能，本项目只实现本需求。

| 地图 | 可用坐标 X | 可用坐标 Y |
| --- | --- | --- |
| Bakurani | 23.35–133.60 | 19.34–129.65 |
| Ozeti | 57.58–143.07 | 21.81–99.56 |
| Zestafona | 19.90–124.89 | 50.70–141.90 |

目前覆盖原站全部三张公开地图；不据此保证未来版本或轮换地图的完整性。三张地图使用相同 tileBounds：X −0.03–163.81、Y −0.01–163.83，与可玩坐标边界分别处理。

| 武器 | 社区参考射程 |
| --- | --- |
| L81 Mortar | 132–684 m |
| SPH-2 | 780–2629 m |

射程来自 [weapons.json](https://github.com/apollyon-sys/wardogs-calculator/blob/ef7cf2d8cb637532b1595b634b87469be6f507b4/data/weapons.json)，地图标定来自同一提交的 `maps/*.json`。这些是社区数据，不是开发商保证值；未做游戏内实测、地形修正或仰角计算。用户已取消爆炸 / 散布半径功能。

罗盘外观参考 [游戏 HUD 截图](https://wardogsgame.net/media/wardogs/field-05.jpg)（画面顶端为 `253 W`）及 [Steam 游戏页](https://store.steampowered.com/app/1867240/WARDOGS/)。采用同样的度数加字母格式，未复制 HUD 美术素材。

地图瓦片按当前可见区域从 `assets.wardogs-artillery.com` 加载，不在本仓库重新分发游戏地图。需要联网，并依赖该公共服务继续可用；失败时显示可重试提示。浏览器缓存处理重复浏览，不宣称完整离线支持。归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## GitHub Pages

仓库已包含 `.github/workflows/pages.yml`。在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，把代码推送至 `main` 后自动测试并部署。

此仓库对应的默认地址为 `https://firepanda415.github.io/MZ-Wardogs/`，只有部署成功后才可访问。所有应用资源使用相对路径，兼容项目子目录。

本次交付尚未部署：远端仓库为私有且未启用 Pages，随后本机 GitHub 凭据需要交互式登录。未更改仓库可见性。私有仓库能否启用 Pages 取决于账号套餐；也可以由仓库所有者选择公开这个项目，参见 [GitHub Pages 说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 已验证

`node test.mjs` 检查四个正方向、3-4-5 距离、同点方位、360° 回绕、两种武器的射程边界、输入校验与屏幕坐标变换。浏览器检查覆盖三张地图、320×667 / 390×844 手机视口和桌面、双语、独立锁定、固定地图点选、收藏刷新持久化及地图隔离。手机视口检查不等于在实体 iOS / Android 设备上实测；双指触控仍建议在真机复核。
