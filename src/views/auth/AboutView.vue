<template>
  <div class="auth-card">
    <h2>About this environment</h2>
    <p>
      <strong>Core Banking Training Environment</strong> is an independent educational
      core-banking product made of two separate experiences: the
      <strong>Core Banking Simulator</strong> (an employee workstation for executing branch
      banking operations) and the <strong>Operations Academy</strong> (banking concept learning,
      opened in its own window).
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
    <div class="flex">
      <router-link class="btn btn-primary" to="/login">Back to sign in</router-link>
      <a class="btn btn-accent" href="/academy" target="_blank" rel="noopener">Open Operations Academy ↗</a>
    </div>
  </div>
</template>

<script setup>
</script>
