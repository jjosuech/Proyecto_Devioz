from flask import Flask, redirect,render_template, jsonify, request, session, url_for
from difflib import get_close_matches
import unicodedata
import json, os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret")

DATA_PATH = os.path.join(app.static_folder, "assets", "data", "products.json")

CATEGORIES_PATH = os.path.join(app.static_folder, "assets", "data", "categories.json")

def load_categories():
    with open(CATEGORIES_PATH, encoding="utf-8") as f:
        return json.load(f)

@app.context_processor
def inject_nav_categories():
    return {"nav_categories": load_categories()}


def load_products():
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)

def cart_state():
    cart = session.get("cart", {})
    items = []
    products = {str(p["id"]): p for p in load_products()}
    for pid, qty in cart.items():
        p = products.get(str(pid))
        if not p:
            continue
        items.append({
            "id": p["id"],
            "title": p["title"],
            "price": float(p["price"]),
            "image": p.get("image", ""),
            "qty": int(qty),
        })
    total = sum(i["price"]*i["qty"] for i in items)
    count = sum(i["qty"] for i in items)
    return {"items": items, "total": round(total, 2), "count": count}

@app.route("/")
def home():
    products = load_products()
    return render_template("pages/home.html", products=products)

#PARTE DEL LOGIN:

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        contraseña = request.form['contraseña']
        if usuario == "admin" and contraseña == "1234":
            session['usuario'] = usuario  # 🔹 Aquí se guarda la sesión
            return redirect(url_for('home'))
    return render_template('pages/login.html')

@app.route('/logout')
def logout():
    session.pop('usuario', None)  # 🔹 Aquí se cierra sesión
    return redirect(url_for('home'))

#-----

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.lower().strip()

@app.route("/shop")
def shop():
    q = request.args.get("q", "").lower().strip()
    cat = request.args.get("cat", "").strip()
    sub = request.args.get("sub", "").strip()
    products = load_products()

    
    print(q)
    print(products)

    #logica de Josue :3
    if q:
        nq = normalize_text(q)

        all_categories = [normalize_text(p.get("category", "")) for p in products]
        all_subcategories = [normalize_text(p.get("branch", "")) for p in products]

        similar_cat = get_close_matches(nq, all_categories, n=1, cutoff=0.7)
        similar_sub = get_close_matches(nq, all_subcategories, n=1, cutoff=0.7)

        if similar_cat:
            match = similar_cat[0]
            products = [p for p in products if normalize_text(p.get("category", "")) == match]
        elif similar_sub:
            match = similar_sub[0]
            products = [p for p in products if normalize_text(p.get("branch", "")) == match]
        else:
            products = [
                p for p in products
                if nq in normalize_text(p["title"]) or nq in normalize_text(p.get("description", ""))
            ]

    # Filtro por categoría
    if cat:
        products = [p for p in products if p.get("category") == cat]

    # Filtro por subcategoría (branch)
    if sub:
        products = [p for p in products if p.get("branch") == sub]

    return render_template(
        "pages/shop.html",
        products=products,
        selected_cat=cat,
        selected_sub=sub
    )


@app.route("/product/<int:pid>")
def product_page(pid):
    products = load_products()

    prod = next((p for p in products if int(p["id"]) == pid), None)


    if not prod:
        return "<h2>Producto no encontrado</h2>", 404

    return render_template("pages/product.html", product=prod)


@app.route("/cart")
def cart_page():
    return render_template("pages/cart.html")

@app.route("/checkout")
def checkout_page():
    return render_template("pages/checkout.html")

@app.route("/about")
def about():
    return render_template("pages/about.html")

@app.route("/contact")
def contact():
    return render_template("pages/contact.html")

@app.route("/become-seller")
def become_seller():
    return render_template("pages/become-seller.html")

@app.get("/api/cart")
def api_cart():
    return jsonify(cart_state())

@app.post("/api/cart/add")
def api_cart_add():
    data = request.get_json(force=True)
    pid = str(data.get("id"))
    qty = int(data.get("qty") or 1)
    cart = session.get("cart", {})
    cart[pid] = int(cart.get(pid, 0)) + qty
    session["cart"] = cart
    session.modified = True
    return jsonify(cart_state())

@app.post("/api/cart/remove")
def api_cart_remove():
    data = request.get_json(force=True)
    pid = str(data.get("id"))
    cart = session.get("cart", {})
    if pid in cart:
        cart.pop(pid)
    session["cart"] = cart
    session.modified = True
    return jsonify(cart_state())

@app.post("/api/cart/clear")
def api_cart_clear():
    session["cart"] = {}
    session.modified = True
    return jsonify(cart_state())

if __name__ == "__main__":
    app.run(debug=True)