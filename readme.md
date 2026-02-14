# Camu-Box

**NFCタグで持ち運べるオルゴール！**

MIDI形式の音楽をNFCタグに格納し、ブラウザ上のプレイヤーで再生できるようにします。

## 利用可能環境

OS: Android  
Browser: Chrome 89以降

WebNFCを使用するため、上記以外の環境では動作しません。

## 使い方

### 再生用NFCタグの作成
GitHub Pagesにて、[書き込みページ](https://manse-murhana.github.io/Camu-Box/writer)を公開していますので、こちらをご利用ください。

### 再生

AndroidスマートフォンでNFCタグを読み込むことで、ブラウザが開き[再生ページ](https://manse-murhana.github.io/Camu-Box/player)に移動します。  
再生ページで再度NFCタグの読み取り操作を行うことで、格納された音楽を再生できます。

## セルフホスト

`docs/player`,`docs/writer`の内容をホストすることで利用できます。
webNFCの仕様により、httpsアクセスできる環境が必要です。

### 開発/ビルド

このプロジェクトのフロントエンドスクリプトはTypeScript (`docs/**/*.ts`) で管理しています。

- 依存関係インストール: `npm install`
- ビルド（`*.ts` -> `*.js`）: `npm run build`
- 監視ビルド: `npm run watch`
