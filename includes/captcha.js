// Generate two random numbers for captcha
function captchaGenerator() {
  const captchaArr = [];
  const num1 = Math.ceil(Math.random() * 99);
  const num2 = Math.ceil(Math.random() * 9);
  captchaArr.push(num1, num2, num1+num2);
  return captchaArr;
}

