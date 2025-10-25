import { NextRequest } from 'next/server';

interface DeploymentContext {
  projectName: string;
  error: string;
  commitSha: string;
  commitMessage: string;
  timestamp: string;
  deploymentUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Only handle deployment failures
    if (payload.type !== 'deployment.failed' && payload.type !== 'deployment.error') {
      return Response.json({ 
        message: 'Not a deployment failure',
        type: payload.type 
      });
    }

    console.log('🚨 Deployment failure detected:', {
      project: payload.deployment?.name,
      url: payload.deployment?.url,
      error: payload.deployment?.errorMessage?.slice(0, 100) + '...'
    });

    // Extract deployment context from Vercel webhook
    const deploymentContext: DeploymentContext = {
      projectName: payload.deployment?.name || 'Unknown Project',
      error: payload.deployment?.errorMessage || 'Unknown error',
      commitSha: payload.deployment?.meta?.githubCommitSha || 'unknown',
      commitMessage: payload.deployment?.meta?.githubCommitMessage || 'No commit message',
      timestamp: payload.createdAt || new Date().toISOString(),
      deploymentUrl: payload.deployment?.url
    };

    // Validate required GitHub environment variables
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      console.error('❌ Missing GitHub configuration:', {
        hasToken: !!process.env.GITHUB_TOKEN,
        hasOwner: !!process.env.GITHUB_OWNER,
        hasRepo: !!process.env.GITHUB_REPO
      });
      
      return Response.json({ 
        error: 'GitHub configuration missing',
        details: 'GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set'
      }, { status: 500 });
    }

    console.log('🔄 Triggering GitHub Action analysis...');

    // Trigger GitHub Action via repository dispatch
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Deployment-Monitor/1.0'
        },
        body: JSON.stringify({
          event_type: 'deployment-failed',
          client_payload: deploymentContext
        })
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('❌ GitHub API error:', {
        status: githubResponse.status,
        statusText: githubResponse.statusText,
        error: errorText
      });
      
      throw new Error(`GitHub API error: ${githubResponse.status} ${githubResponse.statusText} - ${errorText}`);
    }

    console.log('✅ GitHub Action triggered successfully');

    return Response.json({ 
      success: true,
      message: 'GitHub Action analysis triggered successfully',
      context: {
        projectName: deploymentContext.projectName,
        commitSha: deploymentContext.commitSha.slice(0, 7),
        timestamp: deploymentContext.timestamp
      },
      githubAction: {
        repository: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
        eventType: 'deployment-failed',
        triggered: true
      }
    });

  } catch (error) {
    console.error('💥 Deployment monitor error:', error);
    
    // Return error details for debugging
    return Response.json({ 
      error: 'Failed to trigger GitHub Action analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({
    status: 'healthy',
    service: 'GitHub Actions Deployment Monitor',
    timestamp: new Date().toISOString(),
    configuration: {
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      hasGitHubOwner: !!process.env.GITHUB_OWNER,
      hasGitHubRepo: !!process.env.GITHUB_REPO,
      repository: process.env.GITHUB_OWNER && process.env.GITHUB_REPO 
        ? `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` 
        : 'Not configured'
    }
  });
}
