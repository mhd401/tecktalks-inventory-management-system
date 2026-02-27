"""pos cash movements and orders

Revision ID: c2a1b0d6c5b1
Revises: f38d41771a12
Create Date: 2026-02-27

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c2a1b0d6c5b1"
down_revision = "f38d41771a12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add cash columns to pos_sessions
    op.add_column("pos_sessions", sa.Column("opening_cash", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("pos_sessions", sa.Column("closing_cash", sa.Numeric(12, 2), nullable=True))

    # Create cash movements table
    op.create_table(
        "cash_movements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("move_type", sa.Enum("IN", "OUT", name="cashmovetype"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["pos_sessions.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.Index("ix_cash_movements_session_id", "session_id"),
        sa.Index("ix_cash_movements_move_type", "move_type"),
    )

    # Create orders table
    op.create_table(
        "pos_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pos_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("OPEN", "PAID", "VOID", name="orderstatus"), nullable=False, server_default="OPEN"),
        sa.Column("payment_method", sa.Enum("CASH", name="paymentmethod"), nullable=False, server_default="CASH"),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["pos_id"], ["pos.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["pos_sessions.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.Index("ix_pos_orders_pos_id", "pos_id"),
        sa.Index("ix_pos_orders_session_id", "session_id"),
        sa.Index("ix_pos_orders_status", "status"),
    )

    # Create order lines table
    op.create_table(
        "pos_order_lines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["pos_orders.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.Index("ix_pos_order_lines_order_id", "order_id"),
        sa.Index("ix_pos_order_lines_product_id", "product_id"),
    )


def downgrade() -> None:
    op.drop_table("pos_order_lines")
    op.drop_table("pos_orders")
    op.drop_table("cash_movements")

    op.drop_column("pos_sessions", "closing_cash")
    op.drop_column("pos_sessions", "opening_cash")

