"use client";

import type { Table } from "@shared/Table";
import { fetchTables } from "@/service/TableService";
import Image from "next/image";
import { useEffect, useState } from "react";

const HAND = ["TH", "JD", "QH", "KD", "AH"];

export default function AuthBrand() {
    const [tables, setTables] = useState<Table[]>([]);

    useEffect(() => {
        fetchTables().then(setTables).catch(() => setTables([]));
    }, []);

    const players = tables.reduce((sum, table) => sum + table.seats.length, 0);

    return (
        <aside className="auth-brand">
            <div className="auth-suits" aria-hidden="true">
                {HAND.map((card, i) => (
                    <Image key={card} src={`/card/${card}.svg`} alt="" width={72} height={103} unoptimized style={{ left: i * 26, rotate: `${(i - 2) * 8}deg` }} />
                ))}
            </div>
            <h1 className="font-display auth-title whitespace-nowrap">
                Hearts &amp;
                <br />
                Diamonds
            </h1>
            <p className="auth-lede whitespace-nowrap">
                Sit at your first table to claim your $2,500 welcome stack.
            </p>
            <p className="auth-facts">
                <b>{players}</b> players at <b>{tables.length}</b> tables
            </p>
        </aside>
    );
}
