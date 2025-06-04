export default class AboutModel {
  async fetchAboutData() {
    // Simulate an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: 'About Us',
          content: 'This is the about page content.',
        });
      }, 1000);
    });
  }
}