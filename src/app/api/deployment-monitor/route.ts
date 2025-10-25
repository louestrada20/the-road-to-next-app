import { NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  // NOTE: This webhook handler is ready for Vercel Pro plan
  // Currently using GitHub Actions approach (free)
  // See docs/vercel-webhook-deployment-monitor.md for Pro plan setup
  
  return Response.json({
    message: 'Vercel webhook handler ready for Pro plan',
    currentApproach: 'GitHub Actions (free)',
    upgradeInfo: 'See docs/vercel-webhook-deployment-monitor.md',
    proRequired: true
  });

  /* UNCOMMENT WHEN UPGRADING TO VERCEL PRO:
  
  import { resend } from '@/lib/resend';

  interface DeploymentContext {
    projectName: string;
    error: string;
    commitSha: string;
    commitMessage: string;
    timestamp: string;
    deploymentUrl?: string;
  }
  
  try {
    const payload = await _request.json();
    
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

    // Send immediate email notification via Resend
    console.log('📧 Sending immediate email notification...');
    
    try {
      await resend.emails.send({
        from: 'deployments@roadtonextpro.com', // Update with your verified domain
        to: process.env.ADMIN_EMAIL!,
        subject: `🚨 Deployment Failed: ${deploymentContext.projectName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; }
              .error-box { background: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; font-family: monospace; font-size: 12px; }
              .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .footer { background: #6c757d; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>🚨 Deployment Failure Alert</h2>
              <p>Your deployment has failed and is being analyzed automatically.</p>
            </div>
            
            <div class="content">
              <h3>📊 Failure Details</h3>
              <p><strong>Project:</strong> ${deploymentContext.projectName}</p>
              <p><strong>Time:</strong> ${new Date(deploymentContext.timestamp).toLocaleString()}</p>
              <p><strong>Failed Commit:</strong> <a href="https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/commit/${deploymentContext.commitSha}">${deploymentContext.commitSha.slice(0, 7)}</a></p>
              <p><strong>Commit Message:</strong> "${deploymentContext.commitMessage}"</p>
              ${deploymentContext.deploymentUrl ? `<p><strong>Deployment URL:</strong> <a href="${deploymentContext.deploymentUrl}">${deploymentContext.deploymentUrl}</a></p>` : ''}
              
              <div class="error-box">
                <strong>Error Message:</strong><br>
                ${deploymentContext.error}
              </div>
              
              <div class="info-box">
                <h4>🤖 Automated Analysis in Progress</h4>
                <p>GitHub Actions is analyzing this failure and will create a detailed issue with:</p>
                <ul>
                  <li>✅ <strong>Root cause analysis</strong> based on error patterns</li>
                  <li>✅ <strong>Specific fix suggestions</strong> for your codebase</li>
                  <li>✅ <strong>Investigation checklist</strong> with debugging commands</li>
                  <li>✅ <strong>Recent changes analysis</strong> to identify what broke</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues" class="button">📋 View GitHub Issues</a>
                <a href="https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions" class="button">⚙️ GitHub Actions</a>
                <a href="https://vercel.com/${deploymentContext.projectName}" class="button">📊 Vercel Dashboard</a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4>⏱️ What Happens Next (2-3 minutes)</h4>
                <ol>
                  <li><strong>GitHub Action analyzes</strong> your code and error patterns</li>
                  <li><strong>Detailed issue created</strong> with fix suggestions</li>
                  <li><strong>GitHub notification sent</strong> with issue link</li>
                  <li><strong>You investigate</strong> using the provided analysis</li>
                </ol>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>💡 Quick Debugging Tips:</strong></p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Check the failed commit for recent changes</li>
                <li>Run <code>npm run build</code> locally to reproduce</li>
                <li>Look for import/export errors in modified files</li>
                <li>Verify all dependencies are installed</li>
              </ul>
              
              <hr style="margin: 15px 0; border: 1px solid #adb5bd;">
              <p style="margin: 0;">
                🤖 <strong>Powered by:</strong> GitHub Actions + Resend<br>
                💰 <strong>Cost:</strong> FREE (GitHub Actions + Resend free tier)<br>
                🔗 <strong>Repository:</strong> <a href="https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}" style="color: #fff;">${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}</a>
              </p>
            </div>
          </body>
          </html>
        `
      });
      
      console.log('✅ Email sent successfully via Resend');
    } catch (emailError) {
      console.error('❌ Failed to send email via Resend:', emailError);
      // Continue with GitHub Action trigger even if email fails
    }

    // Validate GitHub configuration
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

    // Trigger GitHub Action for detailed analysis
    console.log('🔄 Triggering GitHub Action analysis...');

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
      
      throw new Error(`GitHub API error: ${githubResponse.status} ${githubResponse.statusText}`);
    }

    console.log('✅ GitHub Action triggered successfully');

    return Response.json({ 
      success: true,
      message: 'Email sent and GitHub Action analysis triggered',
      context: {
        projectName: deploymentContext.projectName,
        commitSha: deploymentContext.commitSha.slice(0, 7),
        timestamp: deploymentContext.timestamp,
        emailSent: true,
        githubActionTriggered: true
      }
    });

  } catch (error) {
    console.error('💥 Deployment monitor error:', error);
    
    return Response.json({ 
      error: 'Failed to process deployment failure',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
  
  */ // End of commented Vercel Pro code
}

// Health check endpoint
export async function GET() {
  return Response.json({
    status: 'healthy',
    service: 'GitHub Actions + Resend Deployment Monitor',
    timestamp: new Date().toISOString(),
    configuration: {
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      hasGitHubOwner: !!process.env.GITHUB_OWNER,
      hasGitHubRepo: !!process.env.GITHUB_REPO,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      repository: process.env.GITHUB_OWNER && process.env.GITHUB_REPO 
        ? `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}` 
        : 'Not configured'
    }
  });
}
