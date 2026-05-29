import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

const fallbackImage = "https://loremflickr.com/900/650/indian,street,food?lock=900";

const categoryImageFiles = {
  "Pav Bhaji": "Bombay pav bhaji.jpg",
  "Pav Snacks": "Indian (Mumbai) Vada Pav.jpg",
  Ragda: "Ragda pattice.jpg",
  Chaat: "Delhi Chaat with saunth chutney.jpg",
  "Dahi Chaat": "Dahi puri.jpg",
  Extras: "Pav bread.jpg"
};

const itemImageFiles = {
  "Pav Bhaji": "Bombay pav bhaji.jpg",
  "Butter Pav Bhaji": "Butter Pav Bhaji.jpg",
  "Masala Pav Bhaji": "Pav Bhaji , Maharashtra.jpg",
  "Cheese Masala Pav Bhaji": "CheesePavBhaji.jpg",
  "Cheese Pav Bhaji": "CheesePavBhaji.jpg",
  "Vada Pav (2 Pcs)": "Indian (Mumbai) Vada Pav.jpg",
  "Cheese Vada Pav (2 Pcs)": "ButterGrillVadaPaav Surbhi Mumbai.jpg",
  "Samosa Pav": "Aloo filled Samosa.jpg",
  "Samosa Ragda": "Samosa chaat.jpg",
  "Cheese Samosa Pav": "Samosa with sweet chutney.jpg",
  "Ragda Pav": "https://i.ytimg.com/vi/Hzgm348YYtE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB1m6zvOFoZHSUBsgjHhDWUeIHoZA",
  "Cheese Ragda Pav": "https://img-cdn.publive.online/fit-in/1200x675/filters:format(webp)/sanjeev-kapoor/media/media_files/2025/02/01/Db72XZCO1XOYeCd3xz6E.jpg",
  "Cutlet Ragda": "https://i.ytimg.com/vi/lrWbTGK_A58/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLC3Igv6c4ti5uiKOozH7_5DcrlVgg",
  "Papdi Ragda": "https://i.ytimg.com/vi/ydiHhMVHFVs/maxresdefault.jpg",
  "Kachori Ragda": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1i2fIzXgRiUGGmKEvCuOD9Xs_vAnIiWS6vg&s",
  "Masala Puri": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSIjqfhRwPj955yOoT1zCDMRWLLrXXFziE1g&s",
  "Bhel Puri": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyjTFY1x9o_EURmFBzSb3lreMtpjAT2XousA&s",
  "Dhai Samosa": "Samosa chaat.jpg",
  "Dhai Cutlet": "https://d36v5spmfzyapc.cloudfront.net/wp-content/uploads/2019/10/dahi-batata-puri-chaat-tasted-recipes.png",
  "Dhai Kachori": "https://i.pinimg.com/564x/06/88/48/068848f6225d9da65be2899215372ce0.jpg",
  "Dhai Puri": "Dahi puri.jpg",
  "Extra Pav (2)": "https://indiasweethouse.in/cdn/shop/files/ExtraPav.png?v=1718887487",
  "Sev Puri": "Sev puri.jpg",
  "Aalu Tikka": "Potato (Aloo) Tikki.jpg",
  "Pani Puri (6)": "Pani Puri, Indian.jpg",
  Parcel: "https://scanbot.io/wp-content/uploads/2024/04/top-barcodes-post-parcel-delivery-header-scaled.jpg"
};

function commonsImage(fileName) {
  if (!fileName) return fallbackImage;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) return fileName;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=900`;
}

async function loadMenu() {
  const menuPath = path.join(__dirname, "data", "menu.json");
  const raw = await readFile(menuPath, "utf8");
  return JSON.parse(raw).map((item) => ({
    ...item,
    image: commonsImage(itemImageFiles[item.name] || categoryImageFiles[item.category]),
    imageAlt: `${item.name} - ${item.category}`
  }));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", restaurant: "Kiran Chat Bhandar" });
});

app.get("/api/menu", async (req, res, next) => {
  try {
    const menu = await loadMenu();
    const { category, q } = req.query;
    const search = String(q || "").trim().toLowerCase();

    const filtered = menu.filter((item) => {
      const matchesCategory = !category || category === "All" || item.category === category;
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.toLowerCase().includes(search));

      return matchesCategory && matchesSearch;
    });

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

app.get("/api/categories", async (req, res, next) => {
  try {
    const menu = await loadMenu();
    const categories = ["All", ...new Set(menu.map((item) => item.category))];
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong while loading the menu." });
});

app.listen(port, () => {
  console.log(`Kiran Chat Bhandar API running on http://localhost:${port}`);
});
