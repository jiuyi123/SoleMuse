Component({
  properties: {
    artwork: {
      type: Object,
      value: null,
      observer(artwork) {
        const nickname = artwork && artwork.author ? artwork.author.nickname || '' : '';
        this.setData({ authorInitial: nickname ? nickname.charAt(0).toUpperCase() : 'S' });
      },
    },
    manageable: { type: Boolean, value: false },
  },

  data: { authorInitial: 'S' },

  methods: {
    handleSelect() {
      if (!this.data.artwork || !this.data.artwork.id) return;
      this.triggerEvent('select', { artworkId: this.data.artwork.id });
    },

    handleMenu() {
      this.triggerEvent('menu', { artworkId: this.data.artwork.id });
    },
  },
});
