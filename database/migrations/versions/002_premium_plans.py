"""002 - Add premium plans and plan coverages tables

Revision ID: 002_premium_plans
Revises: 001_initial_schema
Create Date: 2026-04-03 23:55:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '002_premium_plans'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Add premium_plans and plan_coverages tables, enhance products and coverage_options."""

    # Add new columns to products table
    op.add_column('products', sa.Column('code', sa.String(50), unique=True))
    op.add_column('products', sa.Column('currency', sa.String(10), server_default='VND'))
    op.add_column('products', sa.Column('vat_rate', sa.DECIMAL(5, 4), server_default='0.1000'))
    op.add_column('products', sa.Column('insurance_period_days', sa.Integer, server_default='365'))

    # Add new columns to coverage_options table
    op.add_column('coverage_options', sa.Column('code', sa.String(50)))
    op.add_column('coverage_options', sa.Column('sub_limit', sa.DECIMAL(15, 2)))
    op.add_column('coverage_options', sa.Column('sub_limit_label', sa.String(100)))
    op.add_column('coverage_options', sa.Column('territorial_limit', sa.String(255)))

    # Create premium_plans table
    op.create_table('premium_plans',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('product_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(20)),
        sa.Column('net_premium', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('total_premium', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('sort_order', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'])
    )
    op.create_index('ix_premium_plans_product_id', 'premium_plans', ['product_id'])

    # Create plan_coverages table
    op.create_table('plan_coverages',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('plan_id', sa.String(36), nullable=False),
        sa.Column('coverage_option_id', sa.String(36), nullable=False),
        sa.Column('coverage_limit', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('sub_limit', sa.DECIMAL(15, 2)),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['plan_id'], ['premium_plans.id']),
        sa.ForeignKeyConstraint(['coverage_option_id'], ['coverage_options.id'])
    )
    op.create_index('ix_plan_coverages_plan_id', 'plan_coverages', ['plan_id'])


def downgrade() -> None:
    op.drop_index('ix_plan_coverages_plan_id')
    op.drop_table('plan_coverages')
    op.drop_index('ix_premium_plans_product_id')
    op.drop_table('premium_plans')

    op.drop_column('coverage_options', 'territorial_limit')
    op.drop_column('coverage_options', 'sub_limit_label')
    op.drop_column('coverage_options', 'sub_limit')
    op.drop_column('coverage_options', 'code')

    op.drop_column('products', 'insurance_period_days')
    op.drop_column('products', 'vat_rate')
    op.drop_column('products', 'currency')
    op.drop_column('products', 'code')
