<template>
  <section class="page page-terms">
    <BasePanel class="terms-panel">
      <div class="player-header">
        <h1>📜 利用規約</h1>
        <p class="subtitle">本ページをご利用になる前に、必ず以下の利用規約をお読みください。</p>
      </div>

      <div class="terms-intro">
        本ページを利用することで、これらの規約に同意したものとみなされます。
      </div>

      <section class="terms-section">
        <h2>1. 免責事項</h2>
        <p>本ページ(Camu-Box)の利用に関して生じた一切の損害、トラブル、不具合等について、当方は一切の責任を負いません。</p>
        <ul>
          <li>本ページの利用により生じた直接的または間接的な損害</li>
          <li>データの消失、破損、または不正確な処理</li>
          <li>第三者との紛争やトラブル</li>
          <li>デバイスやNFCタグの故障、不具合</li>
          <li>その他、本ページの利用に関連して発生した一切の問題</li>
        </ul>
        <p>本ページは「現状のまま」提供されるものであり、動作の正確性、完全性、安全性について保証するものではありません。</p>
      </section>

      <section class="terms-section">
        <h2>2. 著作権と音源の使用について</h2>
        <p>本ページを利用する際は、以下の点を厳守してください。</p>
        <ul>
          <li>自身が著作権を持つか、著作権者から明確な利用許可を得た音源のみを使用すること</li>
          <li>第三者の権利を侵害する音源を使用しないこと</li>
          <li>違法にダウンロードまたは取得した音源を使用しないこと</li>
        </ul>
        <p>著作権侵害による法的責任は、利用者自身が負うものとします。当方は著作権侵害に関する一切の責任を負いません。</p>
      </section>

      <section class="terms-section">
        <h2>3. 禁止事項</h2>
        <p>以下の行為を禁止します。</p>
        <ul>
          <li>法令に違反する行為</li>
          <li>第三者の権利を侵害する行為</li>
          <li>本ページの運営を妨害する行為</li>
          <li>不正アクセスやデータの改ざん</li>
          <li>その他、公序良俗に反する行為</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>4. サービスの変更・中断</h2>
        <p>当方は、予告なく本ページの内容を変更、または提供を中断・終了する場合があります。これにより生じた損害について、当方は一切の責任を負いません。</p>
      </section>

      <section class="terms-section">
        <h2>5. 規約の変更</h2>
        <p>当方は、必要に応じて本利用規約を変更することがあります。変更後の規約は、本ページに掲載した時点で効力を生じるものとします。</p>
      </section>
    </BasePanel>
  </section>
</template>

<style scoped>
.terms-panel {
  max-width: 900px;
}

.terms-intro {
  margin-bottom: 20px;
  color: var(--muted);
  line-height: 1.8;
}

.terms-section {
  margin-top: 24px;
}

.terms-section h2 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #334155;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.terms-section p {
  margin: 0 0 10px;
  line-height: 1.8;
}

.terms-section ul {
  margin: 0 0 10px;
  padding-left: 22px;
  line-height: 1.8;
}
</style>
