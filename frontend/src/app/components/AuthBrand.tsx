export default function AuthBrand({ page }: { page: "signin" | "signup" }) {
    return (
        <aside className="auth-brand">
            <div className="auth-suits" aria-hidden="true">
                <span className="text-[#e5484d]">&hearts;</span>
                <span className="text-[#e5484d]">&diams;</span>
            </div>
            <p className="eyebrow">5 Card Draw</p>
            <h1 className="font-display auth-title">
                Hearts
                <br />
                &amp; Diamonds
            </h1>
            <p className="auth-lede">
                {page === "signin"
                    ? "Your seat is warm. Sign in to rejoin the tables, your chips and your friends."
                    : "Free to join. Claim a starting stack of $2,500 and take a seat at your first table."}
            </p>
            <ul className="auth-facts">
                <li><b>24</b> tables open</li>
                <li><b>1,308</b> players online</li>
                <li><b>$2,500</b> welcome stack</li>
            </ul>
        </aside>
    );
}