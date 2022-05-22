const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();

const run = async () => {
  console.log(`openning browser and accessing: ${process.env.LOGIN_URL}`);
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(process.env.LOGIN_URL);
    page.waitForNavigation("#loginBox");
    await login(page);
    await page.goto(process.env.CURRENT_CLASSSES_URL);
    await page.waitForTimeout(3000);
    let mustReLogin = page.evaluate(async () => {
      if (document.querySelector("#loginBox")) return true;
      return false;
    });
    if (mustReLogin) {
      await login(page);
    }
    await page.goto(process.env.CURRENT_CLASSSES_URL);
    let subjects = await getAllSubjects(page);
    await createFSFolders(subjects);
    // await accessSubject(page, getEachSubjectHref(subjects))
    await getEachSubjectUnitPDF(page, getEachSubjectHref(subjects));
  } catch (e) {
    console.log(e);
  }
};

const accessSubject = async(page, href) => {
  await page.goto(href)
  console.log(`current on ${href}`);
  return true
}

const getEachSubjectUnitPDF = async (page, subjectHref, arrPDFHref = [], currIndex = 0) => {
      await accessSubject(page, subjectHref[currIndex])
      await page.waitForTimeout(3000)
      console.log('START QUERYING', currIndex);
      let subjectPDFsHref = await page.evaluate(() => {
        let unities = Array.from(
          document.querySelectorAll(':scope .vtbegenerated a span')
        )
        console.log(unities,'unities');
        let _unity = unities.map(test => {

          if(test.innerHTML == 'LIVRO TEXTO'){
            return test.parentNode.href
          }
        }).filter(Boolean)
        return _unity
      })
      arrPDFHref.push(subjectPDFsHref)
      console.log(subjectPDFsHref,'nodes');
      arrPDFHref.push(arrPDFHref, 'arrPDFHref')
      await getEachSubjectUnitPDF(page, subjectHref, arrPDFHref, currIndex+=1)
};

const login = async (page) => {
  console.log("LOGGIN IN");
  try {
    let firstLogin = await page.evaluate(async () => {
      if (!!document.querySelector("#inputRA")) {
        return true;
      }
      return false;
    });
    await page.type(firstLogin ? "#inputRA" : "#user_id", process.env.LOGIN);
    await page.type(
      firstLogin ? "#inputSenha" : "#password",
      process.env.PASSWORD
    );
    await page.click('[type="submit"]');
    console.log(firstLogin ? "MADE FIRST LOGIN" : "MADE SECOND LOGIN");
    await page.waitForTimeout(3000);
    return true;
  } catch (e) {
    console.log(e);
  }
};

const getAllSubjects = async (page) => {
  try {
    const subjects = await page.evaluate(() => {
      let _subject = Array.from(
        document.querySelectorAll(":scope .coursefakeclass li a")
      );
      const EXCLUDED_ITEM = "PROJETO INTEGRADO MULTIDISCIPLINAR";
      // ARRAY.FROM SHOULD HAVE JSON SERIALIZE FORMATTED RESPONSE
      let subject = _subject
        .map((nodeElement) => {
          let _shouldIncludeSubject = true;
          let href = nodeElement.href;
          let name = nodeElement.innerHTML.includes(EXCLUDED_ITEM)
            ? (_shouldIncludeSubject = false)
            : nodeElement.innerHTML;
          if (_shouldIncludeSubject) return { href: href, name: name };
          return false;
        })
        .filter(Boolean);
      return subject;
    });
    if (subjects) {
      subjects.map((subject) => {
        subject.name = subject.name
          .substring(subject.name.indexOf(":") + 1, subject.name.length)
          .trim();
      });
      return subjects;
    }
    return false;
  } catch (e) {
    console.log(e);
  }
};

const createFSFolders = async (subjects) => {
  try {
    let subjectsFolder = "./Subjects";
    if (!fs.existsSync(subjectsFolder)) {
      fs.mkdirSync(subjectsFolder);
    }
    subjects.forEach((subject) => {
      if (!fs.existsSync(`./${subjectsFolder}/${subject.name}`)) {
        fs.mkdirSync(`./${subjectsFolder}/${subject.name}`);
        console.log(`created ${subject.name} folder`);
      }
    });
  } catch (e) {
    console.log(e);
  }
};

const getEachSubjectHref = (subjects) => {
  let hrefSubjects = [];
  subjects.forEach((subject) => hrefSubjects.push(subject.href));
  return hrefSubjects;
};

run();