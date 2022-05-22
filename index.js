const puppeteer = require("puppeteer");
require("dotenv").config();

const url = "";

const start = async () => {
  console.log(`openning browser and accessing: ${process.env.LOGIN_URL}`);
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(process.env.LOGIN_URL);
    page.waitForNavigation("#loginBox");
    await login(page);
    await page.waitForTimeout(3000);
    await getAllSubjects(page);
  } catch (e) {
    console.log(e);
  }
};

const login = async (page) => {
  console.log("LOGGIN IN");
  try {
    await page.type("#inputRA", process.env.LOGIN);
    await page.type("#inputSenha", process.env.PASSWORD);
    await page.click('[type="submit"]');
    console.log("ACCESING HOME PAGE");
    await page.goto(process.env.CURRENT_CLASSSES_URL);

    let reLogin = await page.evaluate(() =>
      document.querySelector("#loginBox")
    );
    if (reLogin) {
      await loginAVA(page);
    }
    await page.waitForTimeout(3000);
    console.log("LISTING CURRENT CLASSES");
    return true;
  } catch (e) {
    console.log(e);
  }
};
const loginAVA = async (page) => {
  try {
    console.log("MUST LOGIN AGAIN");
    await page.type("#user_id", process.env.LOGIN);
    await page.type("#password", process.env.PASSWORD);
    await page.click('[type="submit"]');
    await page.goto(process.env.CURRENT_CLASSSES_URL);
    console.log("LOGGED IN");
    return true;
  } catch (e) {
    console.log(e);
  }
};

const getAllSubjects = async (page) => {
  try {    
    const subjects = await page.evaluate(() => {
      let _subject = Array.from(
        document.querySelectorAll(':scope .coursefakeclass li a')
      );
      // ARRAY.FROM SHOULD BE JSON SERIALIZE FORMATTED
      let subject = _subject.map((nodeElement) => {
        let _shouldInclude = true;
        let href = nodeElement.href;
        let name = nodeElement.innerHTML.includes('PROJETO INTEGRADO MULTIDISCIPLINAR')
          ? (_shouldInclude = false)
          : nodeElement.innerHTML;
        if (_shouldInclude) return { href: href, name: name };
        return false
      });
      return subject.filter(Boolean);
    });
    // console.log(subjects);
    if (subjects) {
      subjects.forEach((subject) => {
        // names
        console.log(
          subject.name.substring(
            subject.name.indexOf(":") + 1,
            subject.name.length
          ).trim()
        );
        // links
        console.log(subject.href);
      });
    }    
    return true;
  } catch (e) {
    console.log(e);
  }
};

start();
