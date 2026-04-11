# Camu-Box

**NFCタグで持ち運べるオルゴール！**

MIDI形式の音楽をNFCタグに格納し、ブラウザ上のプレイヤーで再生できるようにします。

## 利用可能環境

OS: Android  
Browser: Chrome 89以降

WebNFCを使用するため、上記以外の環境では動作しません。

## 使い方

### 再生用NFCタグの作成
GitHub Pagesにて、[書き込みページ](https://manse-murhana.github.io/Camu-Box/#/writer)を公開していますので、こちらをご利用ください。

### 再生

AndroidスマートフォンでNFCタグを読み込むことで、ブラウザが開き[再生ページ](https://manse-murhana.github.io/Camu-Box/#/player)に移動します。  
再生ページで再度NFCタグの読み取り操作を行うことで、格納された音楽を再生できます。

## セルフホスト

`pnpm run build` で生成される `dist/` をホストすることで利用できます。
webNFCの仕様により、httpsアクセスできる環境が必要です。

### 開発/ビルド

フロントエンドは Vue 3 + Vite 構成です。アプリ本体は `src/`、静的公開ファイルは `public/` 配下で管理しています。

- 依存関係インストール: `pnpm install`
- 開発サーバー: `pnpm run dev`
- 型チェック: `pnpm run typecheck`
- テスト実行: `pnpm run test`
- テスト監視: `pnpm run test:watch`
- カバレッジ: `pnpm run test:coverage`
- 本番ビルド: `pnpm run build`
- プレビュー: `pnpm run preview`

### テスト

自動テストは Vitest + Vue Test Utils で構成しています。DOM を使う処理は jsdom 上で実行し、Web NFC や CompressionStream、LZMA、音源再生のような実機依存部分は mock で分離しています。

- unit test: `tests/unit/`
- component test: `tests/components/`
- 共通 setup: `tests/setup.ts`

CI では `pnpm run typecheck`、`pnpm run lint`、`pnpm run test:coverage` を実行します。

### GitHub Pages

このリポジトリには GitHub Actions による Pages デプロイ設定を含めています。公開元は `dist/` です。

- GitHub の Pages 設定で `Source` を `GitHub Actions` に変更
- `main` へ反映すると workflow が `dist/` を公開
- 旧来の `/player/` と `/writer/` パスはリダイレクトで維持
