"use client";

import type { Table } from "@shared/Table";
import { fetchTables } from "@/service/TableService";
import { useEffect, useState } from "react";

export default function AuthBrand() {
    const [tables, setTables] = useState<Table[]>([]);

    useEffect(() => {
        fetchTables().then(setTables).catch(() => setTables([]));
    }, []);

    const players = tables.reduce((sum, table) => sum + table.seats.length, 0);

    return (
        <aside className="auth-brand">
            <div className="auth-suits" aria-hidden="true">
            </div>
            <h1 className="font-display auth-title whitespace-nowrap">
                Hearts &amp;
                <br />
                Diamonds
            </h1>
            <p className="auth-lede whitespace-nowrap">
                Sit at your first table to claim your $2,500 welcome stack.
            </p>
            <ul className="auth-facts">
                <li><b>{tables.length}</b> tables open</li>
                <li><b>{players}</b> players seated</li>
                <li className="ml-auto text-right"><b>$2,500</b> welcome stack</li>
            </ul>
        </aside>
    );
}
