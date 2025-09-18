const db = require("../../config/db"); // tumhari DB connection file
const { Category, Filter,Slider  } = require("../../models"); // ✅ apne models ka path sahi kar lena

const index = async (req, res) => {
  try {
    // ✅ 1. Settings table se data
    const [rows] = await db.query(
      "SELECT id, title, slug, content, status FROM settings WHERE status = '1'"
    );

    let formattedData = {};

    rows.forEach(row => {
      if (row.slug === "about-us") {
        formattedData["about_us"] = row.id;
        formattedData["about_content"] = row.content;
      }
      if (row.slug === "privacy-policy") {
        formattedData["privacy_policy"] = row.id;
        formattedData["privacy_policy_content"] = row.content;
      }
      if (row.slug === "help-support") {
        formattedData["help_support"] = row.id;
        formattedData["help_support_content"] = row.content;
      }
      if (row.slug === "terms & conditions") {
        formattedData["terms_conditions"] = row.id;
        formattedData["terms_conditions_content"] = row.content;
      }
    });

    // ✅ 2. Categories table se data
    const categoriesData = await Category.findAll({
      where: { status: 1 },
      order: [["id", "ASC"]],
      attributes: ["id", "name", "description", "icon", "image", "veg_type"]
    });

    const categories = categoriesData.map(cat => ({
      cat_id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      image: cat.image,
      veg_type: cat.veg_type,
	  res_pro_title: "Dish",   
		
    }));

    // ✅ 3. Filters table se data
    const filtersData = await Filter.findAll({
      order: [["id", "ASC"]],
      attributes: ["id", "filter_name"]
    });

    const filters = filtersData.map(f => ({
      filter_id: f.id,
      filter_name: f.filter_name
    }));
	  
	   // ✅ 4. Slider table se first image
    const sliderData = await Slider.findOne({
      order: [["id", "ASC"]],
      attributes: ["image"]
    });

    const slider = sliderData ? sliderData.image : null;

    return res.json({
      status: true,
      message: "Pages, Categories & Filters fetched successfully",
      data: {
        pages: formattedData,
        categories: categories,
        filters: filters,
		slider: slider
      }
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong"
    });
  }
};


const index_old = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, slug, content, status FROM settings WHERE status = '1'"
    );

    if (rows.length === 0) {
      return res.json({
        status: false,
        message: "No pages found"
      });
    }

    // Custom formatted object
    let formattedData = {};

    rows.forEach(row => {
      if (row.slug === "about-us") {
        formattedData["about_us"] = row.id;
        formattedData["about_content"] = row.content;
        //formattedData["id"] = row.id;
      }
      if (row.slug === "privacy-policy") {
		  formattedData["privacy-policy"] = row.id;
        formattedData["privacy_policy_content"] = row.content;
		   //formattedData["id"] = row.id;
		  
      }
		if (row.slug === "help-support") {
			 formattedData["help-support"] = row.id;
        formattedData["help_support_content"] = row.content;
      }
		if (row.slug === "terms & conditions") {
			formattedData["terms_conditions"] = row.id;
        formattedData["terms & conditions_content"] = row.content;
      }
    });

    return res.json({
      status: true,
      message: "Pages fetched successfully",
      data: formattedData
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong"
    });
  }
};

// ✅ Single page by slug
const show = async (req, res) => {
  try {
    const slug = req.params.slug;

    const [rows] = await db.query(
      "SELECT id, title, slug, content, status FROM settings WHERE slug = ? AND status = '1' LIMIT 1",
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Page not found"
      });
    }

    return res.json({
      status: true,
      message: "Page fetched successfully",
      data: rows[0]
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong"
    });
  }
};

module.exports = { index, show };
