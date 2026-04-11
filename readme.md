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

`npm run build` で生成される `dist/` をホストすることで利用できます。
webNFCの仕様により、httpsアクセスできる環境が必要です。

### 開発/ビルド

フロントエンドは Vue 3 + Vite 構成です。アプリ本体は `src/`、静的公開ファイルは `public/` 配下で管理しています。

- 依存関係インストール: `npm install`
- 開発サーバー: `npm run dev`
- 型チェック: `npm run typecheck`
- 本番ビルド: `npm run build`
- プレビュー: `npm run preview`

### GitHub Pages

このリポジトリには GitHub Actions による Pages デプロイ設定を含めています。公開元は `dist/` です。

- GitHub の Pages 設定で `Source` を `GitHub Actions` に変更
- `main` へ反映すると workflow が `dist/` を公開
- 旧来の `/player/` と `/writer/` パスはリダイレクトで維持
