const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.PROJECT_URL || "http://localhost/projekt294/";
(async () => {
    const browser = await chromium.launch({headless:true, channel:"msedge"});
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const stamp = Date.now();
    const name = "Olti Test " + stamp;
    const sku = "OLTI-TEST-" + stamp;
    let categoryId;
    let createdProduct = false;
    async function data(resource, id, method="GET") {
        return page.evaluate(async ({resource,id,method}) => {
            const response=await fetch("controllers/DataController.php?"+new URLSearchParams({resource,...(id!==undefined?{id}:{})}), {
                method, headers:{"X-CSRF-Token":document.querySelector('meta[name="csrf-token"]').content}
            });
            return {status:response.status,body:response.status===204?null:await response.json()};
        }, {resource,id,method});
    }
    try {
        await page.goto(base+"?view=products");
        await page.locator("#username").fill(process.env.TEST_USERNAME);
        await page.locator("#password").fill(process.env.TEST_PASSWORD);
        await page.getByRole("button",{name:"Anmelden",exact:true}).click();
        await page.locator("#search").waitFor({timeout:45000});
        console.log("PASS login");
        await page.getByRole("link",{name:"Kategorien",exact:true}).click();
        await page.getByRole("link",{name:"+ Kategorie erstellen",exact:true}).click();
        await page.locator("#name").fill(name);
        await page.getByRole("button",{name:"Erstellen",exact:true}).click();
        await page.getByText("Erfolgreich gespeichert.",{exact:true}).waitFor({timeout:30000});
        const categories = await data("categories");
        const category = categories.body.find(item => item.name === name);
        assert(category,"Created category not found");
        categoryId = category.category_id;
        assert.equal(Number(category.active),1,"New category must preserve active status");
        console.log("PASS category create; active="+category.active);
        await page.goto(base+"?view=category&id="+categoryId);
        await page.getByRole("heading",{name,exact:true}).waitFor({timeout:30000});
        await page.screenshot({path:"tests/results/category.png",fullPage:true});
        await page.getByRole("link",{name:"Bearbeiten",exact:true}).click();
        await page.locator("#name").fill(name+" geändert");
        await page.locator("#active").selectOption("0");
        await page.getByRole("button",{name:"Änderungen speichern",exact:true}).click();
        await page.getByRole("heading",{name:name+" geändert",exact:true}).waitFor({timeout:30000});
        assert.equal((await data("category",categoryId)).body.active,"0");
        console.log("PASS category edit and permalink");
        await page.goto(base+"?view=product&action=new");
        await page.locator("#sku").waitFor({timeout:30000});
        await page.locator("#sku").fill(sku);
        await page.locator("#name").fill("Testprodukt <sicher>");
        await page.locator("#id_category").selectOption(String(categoryId));
        await page.locator("#price").fill("12.95");
        await page.locator("#stock").fill("3");
        await page.locator("#description").fill("Browserprüfung: <script>kein HTML</script>");
        await page.screenshot({path:"tests/results/product-form.png",fullPage:true});
        await page.getByRole("button",{name:"Erstellen",exact:true}).click();
        await page.getByRole("heading",{name:"Testprodukt <sicher>",exact:true}).waitFor({timeout:30000});
        createdProduct=true;
        assert.equal((await data("product",sku)).body.name,"Testprodukt <sicher>");
        assert.equal(Number((await data("product",sku)).body.active),1,"New product must preserve active status");
        await page.screenshot({path:"tests/results/product-detail.png",fullPage:true});
        console.log("PASS product create, detail, text escaping");
        await page.reload();
        await page.getByRole("heading",{name:"Testprodukt <sicher>",exact:true}).waitFor({timeout:30000});
        await page.getByRole("link",{name:"Bearbeiten",exact:true}).click();
        await page.locator("#price").fill("14.50");
        await page.getByRole("button",{name:"Änderungen speichern",exact:true}).click();
        await page.getByRole("heading",{name:"Testprodukt <sicher>",exact:true}).waitFor({timeout:30000});
        assert.equal(Number((await data("product",sku)).body.price),14.5);
        console.log("PASS product edit and reload permalink");
        await page.getByRole("button",{name:"Löschen",exact:true}).click();
        await page.screenshot({path:"tests/results/delete.png",fullPage:true});
        await page.getByRole("button",{name:"Abbrechen",exact:true}).click();
        assert.equal((await data("product",sku)).status,200);
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:"tests/results/mobile.png",fullPage:true});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Mobile layout overflows");
        await page.setViewportSize({width:1280,height:900});
        await page.getByRole("button",{name:"Löschen",exact:true}).click();
        await page.getByRole("button",{name:"Endgültig löschen",exact:true}).click();
        await page.getByText("Der Datensatz wurde gelöscht.",{exact:true}).waitFor({timeout:30000});
        assert.equal((await data("product",sku)).status,404);
        createdProduct=false;
        console.log("PASS delete cancellation, deletion, mobile layout");
        await page.goto(base+"?view=category&id="+categoryId);
        await page.getByRole("button",{name:"Löschen",exact:true}).click();
        await page.getByRole("button",{name:"Endgültig löschen",exact:true}).click();
        await page.getByText("Der Datensatz wurde gelöscht.",{exact:true}).waitFor({timeout:30000});
        assert.equal((await data("category",categoryId)).status,404);
        categoryId=undefined;
        await page.getByRole("button",{name:"Abmelden",exact:true}).click();
        await page.locator("#loginForm").waitFor({timeout:30000});
        assert.equal((await data("products")).status,401);
        assert.deepEqual(errors,[]);
        console.log("PASS category delete, logout, no JavaScript errors");
    } catch(error) {
        console.error("Page message:",await page.locator("#meldung").textContent().catch(()=>""));
        throw error;
    } finally {
        if(createdProduct) await data("product",sku,"DELETE");
        if(categoryId) await data("category",categoryId,"DELETE");
        await browser.close();
    }
})().catch(error=>{console.error(error);process.exitCode=1;});
