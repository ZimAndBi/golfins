"""001 - Initial schema creation

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-03-31 12:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Create initial schema"""

    # Create enum types
    op.execute("""
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'adjuster', 'underwriter', 'partner')
    """)
    op.execute("""
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended')
    """)
    op.execute("""
        CREATE TYPE policy_status AS ENUM ('draft', 'active', 'renewal_pending', 'cancelled', 'expired')
    """)
    op.execute("""
        CREATE TYPE claim_status AS ENUM ('submitted', 'reviewing', 'document_requested', 'approved', 'rejected', 'paid')
    """)
    op.execute("""
        CREATE TYPE claim_type AS ENUM ('round_play', 'equipment', 'hole_in_one')
    """)
    op.execute("""
        CREATE TYPE product_type AS ENUM ('round', 'annual', 'hole_in_one', 'equipment')
    """)

    # Users table
    op.create_table('users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('date_of_birth', sa.DateTime),
        sa.Column('role', sa.Enum('customer', 'admin', 'adjuster', 'underwriter', 'partner', name='user_role'),
                  default='customer', nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'suspended', name='user_status'),
                  default='active', nullable=False),
        sa.Column('email_verified', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.Column('deleted_at', sa.DateTime),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Golf Courses table
    op.create_table('golf_courses',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('location_city', sa.String(100)),
        sa.Column('state_province', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('latitude', sa.DECIMAL(10, 8)),
        sa.Column('longitude', sa.DECIMAL(11, 8)),
        sa.Column('phone', sa.String(20)),
        sa.Column('email', sa.String(255)),
        sa.Column('handicap_index', sa.DECIMAL(5, 1)),
        sa.Column('num_holes', sa.Integer),
        sa.Column('par_score', sa.Integer),
        sa.Column('website', sa.String(255)),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Products table
    op.create_table('products',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('product_type', sa.Enum('round', 'annual', 'hole_in_one', 'equipment', name='product_type'),
                  nullable=False),
        sa.Column('version', sa.Integer, default=1),
        sa.Column('effective_date', sa.DateTime),
        sa.Column('end_date', sa.DateTime),
        sa.Column('created_by', sa.String(36)),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Coverage Options table
    op.create_table('coverage_options',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('product_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('base_premium', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('coverage_limit', sa.DECIMAL(10, 2)),
        sa.Column('deductible', sa.DECIMAL(10, 2)),
        sa.Column('active', sa.Boolean, default=True),
        sa.Column('sort_order', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'])
    )
    op.create_index('ix_coverage_options_product_id', 'coverage_options', ['product_id'])

    # Premium Rules table
    op.create_table('premium_rules',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('product_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('min_value', sa.DECIMAL(10, 2)),
        sa.Column('max_value', sa.DECIMAL(10, 2)),
        sa.Column('adjustment_type', sa.String(20), nullable=False),
        sa.Column('adjustment_value', sa.DECIMAL(10, 4), nullable=False),
        sa.Column('operator', sa.String(10), nullable=False),
        sa.Column('priority', sa.Integer, default=0),
        sa.Column('version', sa.Integer, default=1),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_by', sa.String(36)),
        sa.Column('effective_date', sa.DateTime),
        sa.Column('end_date', sa.DateTime),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'])
    )
    op.create_index('ix_premium_rules_product_id', 'premium_rules', ['product_id'])

    # Policies table
    op.create_table('policies',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('policy_number', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('product_id', sa.String(36), nullable=False),
        sa.Column('status', sa.Enum('draft', 'active', 'renewal_pending', 'cancelled', 'expired', name='policy_status'),
                  default='draft', nullable=False),
        sa.Column('premium_amount', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('calculated_by', sa.JSON),
        sa.Column('start_date', sa.DateTime),
        sa.Column('end_date', sa.DateTime),
        sa.Column('renewal_date', sa.DateTime),
        sa.Column('golf_course_id', sa.String(36)),
        sa.Column('partner_id', sa.String(36)),
        sa.Column('certificate_generated', sa.Boolean, default=False),
        sa.Column('certificate_path', sa.String(500)),
        sa.Column('qr_code_token', sa.String(500)),
        sa.Column('payment_status', sa.String(20)),
        sa.Column('payment_date', sa.DateTime),
        sa.Column('transaction_id', sa.String(100)),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.Column('deleted_at', sa.DateTime),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('policy_number'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['golf_course_id'], ['golf_courses.id'])
    )
    op.create_index('ix_policies_policy_number', 'policies', ['policy_number'])
    op.create_index('ix_policies_user_id', 'policies', ['user_id'])
    op.create_index('ix_policies_product_id', 'policies', ['product_id'])

    # Policy Coverages table (line items)
    op.create_table('policy_coverages',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('policy_id', sa.String(36), nullable=False),
        sa.Column('coverage_option_id', sa.String(36), nullable=False),
        sa.Column('premium_amount', sa.DECIMAL(10, 2)),
        sa.Column('coverage_limit', sa.DECIMAL(10, 2)),
        sa.Column('deductible', sa.DECIMAL(10, 2)),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id']),
        sa.ForeignKeyConstraint(['coverage_option_id'], ['coverage_options.id'])
    )
    op.create_index('ix_policy_coverages_policy_id', 'policy_coverages', ['policy_id'])

    # Claims table
    op.create_table('claims',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('claim_number', sa.String(50), nullable=False),
        sa.Column('policy_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('claim_type', sa.Enum('round_play', 'equipment', 'hole_in_one', name='claim_type'),
                  nullable=False),
        sa.Column('status', sa.Enum('submitted', 'reviewing', 'document_requested', 'approved', 'rejected', 'paid',
                  name='claim_status'), default='submitted', nullable=False),
        sa.Column('claim_amount_requested', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('claim_amount_approved', sa.DECIMAL(10, 2)),
        sa.Column('incident_date', sa.DateTime, nullable=False),
        sa.Column('incident_description', sa.Text),
        sa.Column('golf_course_id', sa.String(36)),
        sa.Column('incident_latitude', sa.DECIMAL(10, 8)),
        sa.Column('incident_longitude', sa.DECIMAL(11, 8)),
        sa.Column('case_notes', sa.Text),
        sa.Column('assigned_adjuster_id', sa.String(36)),
        sa.Column('approved_by', sa.String(36)),
        sa.Column('rejection_reason', sa.Text),
        sa.Column('payment_date', sa.DateTime),
        sa.Column('payment_amount', sa.DECIMAL(10, 2)),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('claim_number'),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['golf_course_id'], ['golf_courses.id'])
    )
    op.create_index('ix_claims_claim_number', 'claims', ['claim_number'])
    op.create_index('ix_claims_policy_id', 'claims', ['policy_id'])
    op.create_index('ix_claims_user_id', 'claims', ['user_id'])

    # Claim Documents table
    op.create_table('claim_documents',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('claim_id', sa.String(36), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500)),
        sa.Column('file_size', sa.Integer),
        sa.Column('mime_type', sa.String(100)),
        sa.Column('uploaded_by_id', sa.String(36)),
        sa.Column('verification_status', sa.String(20)),
        sa.Column('verified_by_id', sa.String(36)),
        sa.Column('uploaded_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['claim_id'], ['claims.id']),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'])
    )
    op.create_index('ix_claim_documents_claim_id', 'claim_documents', ['claim_id'])


def downgrade() -> None:
    """Drop initial schema"""

    op.drop_index('ix_claim_documents_claim_id')
    op.drop_table('claim_documents')

    op.drop_index('ix_claims_user_id')
    op.drop_index('ix_claims_policy_id')
    op.drop_index('ix_claims_claim_number')
    op.drop_table('claims')

    op.drop_index('ix_policy_coverages_policy_id')
    op.drop_table('policy_coverages')

    op.drop_index('ix_policies_product_id')
    op.drop_index('ix_policies_user_id')
    op.drop_index('ix_policies_policy_number')
    op.drop_table('policies')

    op.drop_index('ix_premium_rules_product_id')
    op.drop_table('premium_rules')

    op.drop_index('ix_coverage_options_product_id')
    op.drop_table('coverage_options')

    op.drop_table('products')
    op.drop_table('golf_courses')

    op.drop_index('ix_users_email')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS product_type')
    op.execute('DROP TYPE IF EXISTS claim_type')
    op.execute('DROP TYPE IF EXISTS claim_status')
    op.execute('DROP TYPE IF EXISTS policy_status')
    op.execute('DROP TYPE IF EXISTS user_status')
    op.execute('DROP TYPE IF EXISTS user_role')
