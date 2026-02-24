"""baseline_mysql

Revision ID: f38390d08da1
Revises:
Create Date: 2026-02-22 13:37:22.756188
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = "f38390d08da1"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_KW = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            mysql.ENUM("admin", "cashier", collation="utf8mb4_unicode_ci"),
            nullable=False,
            server_default=sa.text("'cashier'"),
        ),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_KW,
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # inventories
    op.create_table(
        "inventories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_KW,
    )
    op.create_index("ix_inventories_id", "inventories", ["id"], unique=False)

    # stocks
    op.create_table(
        "stocks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("inventory_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["inventory_id"], ["inventories.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("inventory_id", "name", name="uq_stocks_inventory_name"),
        **TABLE_KW,
    )
    op.create_index("ix_stocks_id", "stocks", ["id"], unique=False)
    op.create_index("ix_stocks_inventory_id", "stocks", ["inventory_id"], unique=False)

    # products
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("stock_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=255), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["stock_id"], ["stocks.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stock_id", "sku", name="uq_products_stock_sku"),
        **TABLE_KW,
    )
    op.create_index("ix_products_id", "products", ["id"], unique=False)
    op.create_index("ix_products_stock_id", "products", ["stock_id"], unique=False)

    # pos
    op.create_table(
        "pos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("stock_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["stock_id"], ["stocks.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stock_id", "name", name="uq_pos_stock_name"),
        **TABLE_KW,
    )
    op.create_index("ix_pos_id", "pos", ["id"], unique=False)
    op.create_index("ix_pos_stock_id", "pos", ["stock_id"], unique=False)

    # pos_sessions
    op.create_table(
        "pos_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pos_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            mysql.ENUM("OPEN", "CLOSED", collation="utf8mb4_unicode_ci"),
            nullable=False,
        ),
        sa.Column("opened_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["pos_id"], ["pos.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        **TABLE_KW,
    )
    op.create_index("ix_pos_sessions_id", "pos_sessions", ["id"], unique=False)
    op.create_index("ix_pos_sessions_pos_id", "pos_sessions", ["pos_id"], unique=False)
    op.create_index("ix_pos_sessions_status", "pos_sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_pos_sessions_status", table_name="pos_sessions")
    op.drop_index("ix_pos_sessions_pos_id", table_name="pos_sessions")
    op.drop_index("ix_pos_sessions_id", table_name="pos_sessions")
    op.drop_table("pos_sessions")

    op.drop_index("ix_pos_stock_id", table_name="pos")
    op.drop_index("ix_pos_id", table_name="pos")
    op.drop_table("pos")

    op.drop_index("ix_products_stock_id", table_name="products")
    op.drop_index("ix_products_id", table_name="products")
    op.drop_table("products")

    op.drop_index("ix_stocks_inventory_id", table_name="stocks")
    op.drop_index("ix_stocks_id", table_name="stocks")
    op.drop_table("stocks")

    op.drop_index("ix_inventories_id", table_name="inventories")
    op.drop_table("inventories")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")