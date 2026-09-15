const demoContentService = require('../../../../services/demo-content-service');

Page({
  data: {
    conversationId: '',
    participant: null,
    currentUserAvatar: '',
    messages: [],
    inputValue: '',
    inputReady: false,
    scrollTarget: '',
    loading: true,
    loadFailed: false,
    sending: false,
    sendFailed: false,
  },

  onLoad(options) {
    const conversationId = options.id || '';
    this.setData({ conversationId });
    this.loadConversation();
  },

  async loadConversation() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const conversation = await demoContentService.getConversation(this.data.conversationId);
      if (!conversation) throw new Error('Conversation not found');
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const participant = {
        ...conversation.participant,
        initial: conversation.participant.name.slice(0, 1),
      };
      this.setData({
        participant,
        currentUserAvatar: conversation.currentUser.avatarUrl,
        messages: conversation.messages,
        scrollTarget: lastMessage ? `message-${lastMessage.id}` : '',
        loading: false,
      });
    } catch (error) {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  handleInput(event) {
    const inputValue = event.detail.value;
    this.setData({ inputValue, inputReady: Boolean(inputValue.trim()), sendFailed: false });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.sending) return;

    this.setData({ sending: true, sendFailed: false });
    try {
      const message = await demoContentService.sendConversationMessage(this.data.conversationId, content);
      this.setData({
        messages: [...this.data.messages, message],
        inputValue: '',
        inputReady: false,
        scrollTarget: `message-${message.id}`,
        sending: false,
      });
    } catch (error) {
      this.setData({ sending: false, sendFailed: true });
    }
  },
});
