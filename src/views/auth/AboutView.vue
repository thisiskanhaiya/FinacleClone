<template>
  <div class="auth-card">
    <h2>About this environment</h2>
    <p>
      <strong>Core Banking Training Environment</strong> is an independent educational
      core-banking simulator. It combines the <strong>Branch Operations Simulator</strong>
      (executable branch banking operations) with the <strong>Bank Operations Workbook</strong>
      (guided employee training) in one local application.
    </p>
    <p>
      All customers, accounts, employees, transactions, limits and GL accounts are fictional
      and stored only in this browser. No real banking network, API or institution is involved.
    </p>
    <div class="alert alert-info">
      Independent educational core-banking simulator using fictional data.
      Not affiliated with or endorsed by any bank, Infosys or Finacle.
    </div>
    <p class="small muted">
      Operation codes used here (for example CIF-CREATE-001) are training-system codes created
      for this simulator. They are not menu codes of any commercial core-banking product.
    </p>
    <router-link class="btn btn-primary" to="/login">Back to sign in</router-link>
  </div>
</template>

<script setup>
</script>
