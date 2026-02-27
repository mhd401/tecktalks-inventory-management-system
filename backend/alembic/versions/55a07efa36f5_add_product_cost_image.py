from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "55a07efa36f5"
down_revision = "c2a1b0d6c5b1"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("products", sa.Column("cost", sa.Numeric(10, 2), server_default="0.00", nullable=False))
    op.add_column("products", sa.Column("image_url", sa.String(length=1024), nullable=True))

def downgrade():
    op.drop_column("products", "image_url")
    op.drop_column("products", "cost")