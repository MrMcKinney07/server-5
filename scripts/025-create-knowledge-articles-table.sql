-- Knowledge base articles for McKinney One

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  -- Relationships to other entities
  related_mission_template_id UUID REFERENCES mission_templates(id) ON DELETE SET NULL,
  related_transaction_stage VARCHAR(50),
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories: lead_handling, listings, transactions, open_house, training, general

-- RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Admins can manage all articles
CREATE POLICY "Admins can manage articles" ON knowledge_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated can view published articles
CREATE POLICY "Users can view published articles" ON knowledge_articles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_published = true
  );

-- Create indexes
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_slug ON knowledge_articles(slug);
CREATE INDEX idx_knowledge_articles_mission ON knowledge_articles(related_mission_template_id);
