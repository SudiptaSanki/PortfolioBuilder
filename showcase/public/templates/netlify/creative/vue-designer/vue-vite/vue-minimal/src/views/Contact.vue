
<template>
  <div class="contact" style="max-width: 600px;">
    <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Let's talk</h2>
    <p>Have a project in mind? Feel free to reach out.</p>
    
    <form @submit.prevent style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
      <input type="text" placeholder="Name" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem;" />
      <input type="email" placeholder="Email" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem;" />
      <textarea placeholder="Message" rows="5" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem; resize: vertical;"></textarea>
      <button class="btn" style="border: none; cursor: pointer; justify-content: center; font-size: 1rem;">Send Message</button>
    </form>
  </div>
</template>
