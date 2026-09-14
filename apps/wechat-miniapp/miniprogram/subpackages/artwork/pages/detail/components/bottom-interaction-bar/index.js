Component({
  properties: {
    commentText: { type: String, value: '' },
    favoriteCount: { type: Number, value: 0 },
    favorited: { type: Boolean, value: false },
    likeCount: { type: Number, value: 0 },
    liked: { type: Boolean, value: false },
    shareCount: { type: Number, value: 0 },
  },

  data: {
    inputFocused: false,
  },

  methods: {
    handleInput(event) {
      this.triggerEvent('input', { value: event.detail.value });
    },

    handleFocus() {
      this.setData({ inputFocused: true });
    },

    handleBlur() {
      this.setData({ inputFocused: false });
    },

    handleSubmit() {
      this.triggerEvent('submit');
    },

    handleLike() {
      this.triggerEvent('like');
    },

    handleFavorite() {
      this.triggerEvent('favorite');
    },
  },
});
