Component({
  properties: {
    artwork: { type: Object, value: null },
  },

  methods: {
    handleSelect() {
      if (!this.data.artwork || !this.data.artwork.id) return;
      this.triggerEvent('select', { artworkId: this.data.artwork.id });
    },
  },
});
