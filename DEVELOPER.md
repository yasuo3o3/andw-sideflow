# Developer Documentation

This document provides development guidelines, setup instructions, and best practices for the andW SideFlow WordPress plugin.

## Development Environment Setup

### Requirements
- **WordPress**: 5.0 or higher
- **PHP**: 7.4 or higher
- **Node.js**: 16+ (for development tools)
- **Composer**: Latest version

### Initial Setup
```bash
# Clone repository
git clone <repository-url> andw-sideflow
cd andw-sideflow

# Install PHP dependencies (if using Composer)
composer install

# Install Node.js dependencies (if applicable)
npm install
```

## Code Quality & Standards

### PHP CodeSniffer (PHPCS)
Run WordPress Coding Standards checks:

```bash
# Install WPCS (if not already installed)
composer global require wp-coding-standards/wpcs
phpcs --config-set installed_paths ~/.composer/vendor/wp-coding-standards/wpcs/

# Run PHPCS with WordPress standards
phpcs --standard=WordPress andw-sideflow.php
phpcs --standard=WordPress includes/
phpcs --standard=WordPress-Extra andw-sideflow.php

# Auto-fix issues where possible
phpcbf --standard=WordPress andw-sideflow.php
```

### Plugin Check (WordPress.org Tool)
```bash
# Install Plugin Check plugin in your WordPress development environment
# Or use the online tool: https://wordpress.org/plugins/developers/

# Run plugin check via WP-CLI
wp plugin-check andw-sideflow

# Check specific standards
wp plugin-check andw-sideflow --checks=plugin_repo
```

### Static Analysis
```bash
# PHP syntax check
php -l andw-sideflow.php
find . -name "*.php" -exec php -l {} \;

# Security scanning (optional)
# composer require --dev phpstan/phpstan
# vendor/bin/phpstan analyse andw-sideflow.php
```

## Build Process

### Version Management
```bash
# Update version across all files
# Edit the following files with new version:
# - andw-sideflow.php (Plugin header + ANDW_SIDEFLOW_VERSION constant)
# - readme.txt (Stable tag)
# - languages/andw-sideflow.pot (Project-Id-Version)
# - CHANGELOG.md

# Verify version consistency
grep -r "0\.3\.1" . --exclude-dir=.git
```

### Language Files
```bash
# Generate/update POT file
wp i18n make-pot . languages/andw-sideflow.pot --domain=andw-sideflow

# Create language files for specific locales
cp languages/andw-sideflow.pot languages/andw-sideflow-ja.po
# Edit .po file with translations
# Generate .mo file
msgfmt languages/andw-sideflow-ja.po -o languages/andw-sideflow-ja.mo
```

### Distribution Package
```bash
# Create distribution ZIP (excluding development files)
git archive --format=zip --output=../andw-sideflow.zip --prefix=andw-sideflow/ HEAD

# Verify package contents
unzip -l ../andw-sideflow.zip
```

## Testing

### Manual Testing Checklist
- [ ] Plugin activation/deactivation without errors
- [ ] Settings save/load correctly
- [ ] Frontend display renders properly
- [ ] Mobile responsiveness
- [ ] Admin interface functionality
- [ ] REST API endpoints respond correctly
- [ ] Uninstall cleanup removes all data

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### WordPress Environment Testing
- [ ] WordPress 5.0 (minimum supported)
- [ ] WordPress 6.8 (latest tested)
- [ ] PHP 7.4 (minimum supported)
- [ ] PHP 8.1+ (recommended)
- [ ] Multisite installation
- [ ] Various themes compatibility

## CI/CD Integration (Future Implementation)

### GitHub Actions Workflow
Create `.github/workflows/main.yml`:

```yaml
name: WordPress Plugin CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        php-version: [7.4, 8.0, 8.1]
        wordpress-version: [5.0, latest]

    steps:
    - uses: actions/checkout@v3

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: ${{ matrix.php-version }}

    - name: Install dependencies
      run: composer install

    - name: Run PHPCS
      run: vendor/bin/phpcs --standard=WordPress .

    - name: Run Plugin Check
      run: wp plugin-check .
```

### Automated Deployment
```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'

  steps:
  - name: Deploy to WordPress.org
    uses: 10up/action-wordpress-plugin-deploy@stable
    env:
      SVN_USERNAME: ${{ secrets.SVN_USERNAME }}
      SVN_PASSWORD: ${{ secrets.SVN_PASSWORD }}
```

## WordPress.org Submission Guidelines

### Pre-submission Checklist
- [ ] All PHPCS errors resolved
- [ ] Plugin Check passes without critical issues
- [ ] readme.txt follows WordPress standards
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Accessibility testing completed
- [ ] Translation ready (POT file included)

### Submission Process
1. **Prepare clean package**: Ensure `.gitattributes` excludes dev files
2. **Final testing**: Test on fresh WordPress installation
3. **Submit to WordPress.org**: Upload ZIP via plugin submission form
4. **SVN repository**: Set up for future updates

## Security Guidelines

### Input Validation
- Always use `sanitize_*()` functions for input
- Validate data types with `is_numeric()`, `is_array()`, etc.
- Use `wp_verify_nonce()` for form submissions
- Check `current_user_can()` for permissions

### Output Escaping
- Use `esc_html()`, `esc_attr()`, `esc_url()` for output
- Use `wp_kses()` for allowed HTML
- Never output unescaped user data

### Database Queries
- Always use `$wpdb->prepare()` for dynamic queries
- Use WordPress functions where available
- Implement proper caching strategies

## Performance Optimization

### Frontend Performance
- Enqueue scripts only where needed
- Use `wp_enqueue_scripts` conditionally
- Implement lazy loading for images
- Minimize HTTP requests

### Backend Performance
- Use transients for cached data
- Avoid autoloaded options for large data
- Implement proper database indexing
- Use WordPress object cache where applicable

## Debugging

### Development Debug Settings
```php
// wp-config.php settings for development
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('SCRIPT_DEBUG', true);
```

### Plugin-specific Debugging
```php
// Enable andW SideFlow debug mode
$config['dev']['debug'] = true;

// Check debug.log for entries
tail -f wp-content/debug.log | grep andw_sideflow
```

## Contributing

### Code Style
- Follow WordPress Coding Standards
- Use meaningful variable and function names
- Comment complex logic thoroughly
- Maintain consistent indentation (tabs for PHP)

### Git Workflow
- Use feature branches for development
- Write clear commit messages
- Squash commits before merging
- Tag releases with semantic versioning

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation if needed
5. Submit pull request with detailed description

---

For additional support, refer to:
- [WordPress Plugin Developer Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [Plugin Directory Guidelines](https://developer.wordpress.org/plugins/wordpress-org/)